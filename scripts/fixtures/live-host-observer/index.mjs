// Test fixture only. Never include in the distributed plugin or global config.
import { Plugin } from "@opencode/plugin";
import { Rpc } from "@opencode/plugin/rpc";
import { AutoReasoning } from "../../../dist/rpc.js";

const Probe = Rpc.define({ id: "auto-reasoning-live-probe", events: {}, methods: {
  read: { input: { type: "object", properties: {}, additionalProperties: false },
    output: { type: "object", properties: { trace: { type: "array", items: { type: "object" } } }, required: ["trace"], additionalProperties: false } },
} });
export default Plugin.define({ id: "auto-reasoning-live-probe", async setup(ctx) {
  const trace = [];
  const record = value => { if (trace.length < 64) trace.push(value); };
  const admitted = new Map(); const approved = new Map(); const dispatched = new Set();
  const registrations = [];
  registrations.push(await ctx.session.hook("prompt", event => {
    if (admitted.size >= 2 && !admitted.has(event.sessionID)) throw new Error("Live test prompt cap");
    admitted.set(event.sessionID, event.messageID);
    record({ type: "prompt", sessionID: event.sessionID, messageID: event.messageID });
  }));
  registrations.push(await ctx.session.hook("title", event => { event.result = "Auto Reasoning live test"; }));
  registrations.push(await ctx.session.hook("retry", event => { event.decision = { retry: false }; }));
  registrations.push(await ctx.session.hook("compaction", event => { event.result = { summary: "Live test; no compaction generation." }; }));
  registrations.push(await ctx.session.hook("context", async event => {
    const snapshot = await ctx.rpc(AutoReasoning).status({ sessionID: event.sessionID });
    const latest = event.messages.findLast(m => m.role === "user");
    record({ type: "context", sessionID: event.sessionID, messageID: latest?.id ?? null,
      admittedMessageID: admitted.get(event.sessionID) ?? null, model: { ...event.model },
      override: event.options.reasoningEffort ?? null, status: snapshot.status,
      classifierRequests: snapshot.classifier.modelUsage?.requests ?? null });
    if (event.model.providerID !== "openai" || event.model.id !== "gpt-6.1-sol" ||
      (event.model.variant && event.model.variant !== "default") ||
      !latest?.id || latest.id !== admitted.get(event.sessionID) || snapshot.status.reason !== "model-assessment" ||
      snapshot.classifier.modelUsage?.requests > 2 || approved.has(event.sessionID) || approved.size >= 2) {
      throw new Error("Live test pre-dispatch guard");
    }
    approved.set(event.sessionID, snapshot.status.effort);
    // Test-only guard rails: do not send global instructions or expose tools. This
    // does not modify persisted history, production code, or the selected effort.
    event.system.splice(0, event.system.length, { type: "text", text:
      "This is an integration transport test. Do not execute or solve the task. Do not use tools. Reply with exactly OK." });
    for (const key of Object.keys(event.tools)) delete event.tools[key];
    event.options.maxTokens = 1024;
  }, { providerID: "openai" }));
  registrations.push(await ctx.session.hook("http.request", async event => {
    if (event.kind !== "primary" || !approved.has(event.sessionID) || dispatched.has(event.sessionID)) {
      throw new Error("Live test dispatch cap");
    }
    const body = await event.request.clone().json();
    // Never inspect or retain headers, URL query parameters, instructions, or input.
    record({ type: "wire", sessionID: event.sessionID, model: body.model ?? null,
      effort: body.reasoning?.effort ?? body.reasoning_effort ?? null,
      maxTokens: body.max_output_tokens ?? body.max_completion_tokens ?? body.max_tokens ?? null });
    if (body.model !== "gpt-6.1-sol" || (body.reasoning?.effort ?? body.reasoning_effort) !== approved.get(event.sessionID)) {
      throw new Error("Live test final wire mismatch");
    }
    dispatched.add(event.sessionID);
  }, { providerID: "openai" }));
  registrations.push(await ctx.session.hook("http.response", event => {
    record({ type: "response", sessionID: event.sessionID, status: event.response.status });
  }, { providerID: "openai" }));
  registrations.push(await ctx.rpc.register(Probe, { read: async () => ({ trace: [...trace] }) }));
  return async () => { await Promise.allSettled(registrations.map(r => r.dispose())); trace.length = 0; admitted.clear(); approved.clear(); dispatched.clear(); };
} });
