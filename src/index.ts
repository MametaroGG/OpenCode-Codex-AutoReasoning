import { Plugin } from "@opencode/plugin";
import type { SessionContext } from "@opencode/plugin/promise/session";
import { parseConfig, type Config } from "./config.js";
import { Controller } from "./controller.js";
import { selectEffort, supportedEfforts, hasReasoningOverride } from "./reasoning.js";
import { AutoReasoning, statusSessionID } from "./rpc.js";
import { Cache } from "./cache.js";
import { sanitizePrompt, boundedModelInput } from "./privacy.js";
import { createModelClassifier } from "./model-classifier.js";

// Exported separately so tests can drive real API callbacks without calling a model.
export async function setup(ctx: Plugin.Context) {
  let config: Config;
  try { config = parseConfig(ctx.options); }
  catch {
    console.warn("[auto-reasoning] Invalid options; plugin inactive.");
    return;
  }
  const engine = createModelClassifier(ctx, config);
  const controller = new Controller(config, engine);
  const admitted = new Cache<{ text: string; attachments: number; conflicted?: boolean }>(config.maxEntries, config.cacheTtlMs);
  const promptKey = (sessionID: string, messageID: string) => `${sessionID}\0${messageID}`;
  let active = true;
  const registrations: { dispose(): Promise<void> }[] = [];
  const events = new AbortController();
  async function apply(event: SessionContext): Promise<void> {
    const status = (reason: string) => controller.statuses.set(event.sessionID, { reason });
    if (!active) return;
    if (!config.enabled) { status("disabled"); return; }
    // Development-model support is deliberately limited to the OpenAI provider.
    if (event.model.providerID !== "openai") { status("unsupported-provider"); return; }
    if (hasReasoningOverride(event.options)) { status("existing-request-override"); return; }
    if (event.model.variant && event.model.variant !== "default" && !config.manualOverride) { status("explicit-model-variant"); return; }
    const users = event.messages.filter(m => m.role === "user");
    const latest = users.at(-1);
    if (!latest) { status("no-user-prompt"); return; }
    const captured = latest.id ? admitted.get(promptKey(event.sessionID, latest.id)) : undefined;
    const original = captured?.conflicted ? undefined : captured;
    const previousOriginals = users.slice(-3, -1).flatMap(m => {
      const value = m.id ? admitted.get(promptKey(event.sessionID, m.id)) : undefined;
      return value && !value.conflicted ? [value.text] : [];
    });
    if (!original && !config.manualOverride) { status("original-prompt-unavailable"); return; }
    const task = { text: original?.text ?? "", previous: previousOriginals,
      attachments: original?.attachments ?? 0,
      remoteInput: original ? boundedModelInput(original.text, previousOriginals, original.attachments, config.modelMaxInputChars) : undefined };
    const model = (await ctx.model.list()).data.find(m =>
      m.providerID === event.model.providerID && m.id === event.model.id);
    if (!active) return;
    if (!model) { status("model-not-found"); return; }
    // OpenCode 2.2.6 materializes an omitted variant as "default" on sessions.
    // It is an automatic sentinel only when no real catalog variant has that ID.
    if (event.model.variant === "default" && model.variants.some(v => v.id === "default") && !config.manualOverride) {
      status("explicit-model-variant"); return;
    }
    const supported = supportedEfforts(model);
    if (!supported.length) { status("no-confirmed-efforts"); return; }
    const assessment = config.manualOverride ? undefined : await controller.assess(event.sessionID, latest.id ?? task.text, task);
    if (!active) return;
    if (assessment?.failed) { status("classification-failed-preserved"); return; }
    const decision = assessment?.decision;
    const desired = config.manualOverride ?? decision?.effort ?? config.defaultEffort;
    const selected = selectEffort(desired, supported, config);
    if (!selected) { status("no-effort-in-configured-range"); return; }
    const variant = event.model.variant ? model.variants.find(v => v.id === event.model.variant) : undefined;
    const current = variant?.settings?.reasoningEffort ?? model.settings?.reasoningEffort;
    controller.statuses.set(event.sessionID, { effort: selected,
      reason: config.manualOverride ? "manual-override" : "model-assessment",
      difficulty: decision?.difficulty, reasons: decision?.reasons,
      ...(decision?.classifierModel ? { classifierModel: decision.classifierModel } : {}),
      cacheHit: assessment?.cacheHit, durationMs: assessment?.durationMs });
    if (config.debug) console.debug("[auto-reasoning]", JSON.stringify({ effort: selected,
      difficulty: decision?.difficulty, cacheHit: assessment?.cacheHit }));
    // The only mutation is deliberately last: all failure paths preserve the request.
    if (current !== selected) event.options.reasoningEffort = selected;
  }
  try {
    registrations.push(await ctx.session.hook("prompt", event => {
      if (active && config.enabled && config.allowModelRequests) {
        // Captured BEFORE file/skill expansion. Never substitute resolved source text on a miss.
        const key = promptKey(event.sessionID, event.messageID);
        const value = { text: sanitizePrompt(event.prompt.text, config.modelMaxInputChars), attachments: event.prompt.files?.length ?? 0 };
        const previous = admitted.get(key);
        // Prompt hooks are retry-safe, not exactly-once. Conflicting concurrent admissions
        // must not make a canonical message send the losing draft to an external model.
        admitted.set(key, previous && (previous.conflicted || previous.text !== value.text || previous.attachments !== value.attachments)
          ? { ...previous, conflicted: true } : value);
      }
    }));
    registrations.push(await ctx.session.hook("context", async event => {
      try { await apply(event); }
      catch { if (active) controller.statuses.set(event.sessionID, { reason: "hook-failed-preserved" }); }
    }, { providerID: "openai" }));
    registrations.push(await ctx.tool.transform(editor => {
      editor.add({ name: "auto_reasoning_status", description: "Read current reasoning selection, reason, local metrics and observed session usage. No model calls.",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: async (_input, context) => ({ content: JSON.stringify(controller.snapshot(context.sessionID)) }) });
    }));
    registrations.push(await ctx.rpc.register(AutoReasoning, {
      status: async input => controller.snapshot(statusSessionID(input)),
    }));
  } catch {
    active = false;
    controller.close();
    admitted.clear();
    await Promise.allSettled(registrations.map(r => r.dispose()));
    console.warn("[auto-reasoning] Registration failed; plugin inactive.");
    return;
  }
  // Store the latest published counters, not sums: events can be snapshots or repeated.
  const observer = (async () => {
    try {
      for await (const event of ctx.event.subscribe({ types: ["session.usage.updated"], signal: events.signal })) {
        if (active && controller.statuses.get(event.data.sessionID)) controller.usage.set(event.data.sessionID, {
          tokens: event.data.tokens, cost: event.data.cost, observedAt: event.created,
        });
      }
    } catch { /* Telemetry is optional and must never interrupt a session. */ }
  })();
  return async () => {
    active = false;
    events.abort();
    controller.close();
    admitted.clear();
    await Promise.allSettled(registrations.map(r => r.dispose()));
    await observer;
  };
}

export default Plugin.define({ id: "auto-reasoning", setup });
