import { test } from "node:test";
import assert from "node:assert/strict";
import { Agent, Model, type Plugin } from "@opencode/plugin";
import type { SessionContext, SessionPrompt } from "@opencode/plugin/promise/session";
import { setup } from "../src/index.js";

function harness(options: Record<string, unknown> = {}, current = "medium", development?: {
  id?: string; modelID?: string; providerID: string; settings: Record<string, unknown>; variants: { id: string; settings?: Record<string, unknown> }[];
}) {
  let hook: ((event: SessionContext) => Promise<void>) | undefined;
  let promptHook: ((event: SessionPrompt) => void) | undefined;
  let contextScope: unknown;
  let modelCalls = 0;
  let modelResponse = '{"difficulty":"Very Low","reasons":["narrow-textual-edit"]}';
  let sentPrompt = "";
  let tool: { execute(input: unknown, ctx: { sessionID: string }): Promise<{ content: string }> } | undefined;
  let disposed = 0;
  let modelError = false;
  let rpcError = false;
  let modelWait: Promise<void> | undefined;
  let rpcStatus: ((input: unknown) => Promise<unknown>) | undefined;
  let variants = ["minimal", "low", "medium", "high", "xhigh"].map(e => ({ id: e, settings: { reasoningEffort: e } }));
  const classifier = Model.Ref.parse(typeof options.classifierModel === "string" ? options.classifierModel : "openai/gpt-6-luna#low");
  const registration = { dispose: async () => { disposed++; } };
  const ctx = {
    options: { allowModelRequests: true, ...options },
    session: { hook: async (name: string, fn: unknown, scope: unknown) => {
      if (name === "context") { hook = fn as typeof hook; contextScope = scope; }
      else { assert.equal(name, "prompt"); promptHook = fn as typeof promptHook; }
      return registration;
    } },
    model: { list: async () => {
      if (modelWait) await modelWait;
      if (modelError) throw new Error("sensitive-api-key-must-not-be-logged");
       return { data: [{ id: "test-model", providerID: "openai", enabled: true, status: "active", variants, settings: { reasoningEffort: current }, ...development },
         { id: classifier.id, modelID: classifier.id, providerID: classifier.providerID, enabled: true, status: "active", variants: [{ id: "low" }] }] };
    } },
    tool: { transform: async (fn: (e: { add(t: typeof tool): void }) => void) => {
      fn({ add(t) { tool = t; } }); return registration;
    } },
    event: { async *subscribe() { /* no network or inference */ } },
    rpc: { register: async (_definition: unknown, handlers: { status: typeof rpcStatus }) => {
      if (rpcError) throw new Error("rpc-registration-failed");
      rpcStatus = handlers.status; return registration;
    } },
    experimental: { generate: { text: async (input: { model: unknown; prompt: string }) => {
      modelCalls++; sentPrompt = input.prompt;
      assert.deepEqual(input.model, classifier);
      return { text: modelResponse };
    } } },
  } as unknown as Plugin.Context;
  const event = (text = "README.mdの誤字を修正", sessionID = "s1"): SessionContext => ({
    sessionID: sessionID as SessionContext["sessionID"], agent: Agent.ID.make("build"), model: Model.Ref.parse(`${development?.providerID ?? "openai"}/${development?.id ?? "test-model"}`),
    messages: [{ id: "m1", role: "user", content: [{ type: "text", text }] }],
    options: {}, system: [], tools: {},
  });
  const admissions = new Set<string>();
  const admit = (e: SessionContext, text: string, files = 0) => {
    const user = e.messages.findLast(m => m.role === "user")!;
    admissions.add(`${e.sessionID}:${user.id}`);
    promptHook!({ sessionID: e.sessionID, messageID: user.id, delivery: "steer",
      prompt: { text, files: Array.from({ length: files }, () => ({ uri: "file:///private.ts" })) },
    } as unknown as SessionPrompt);
  };
  return { ctx, event, apply: (e: SessionContext, capture = true) => {
      const user = e.messages.findLast(m => m.role === "user");
      if (capture && user && !admissions.has(`${e.sessionID}:${user.id}`)) {
        admit(e, user.content.filter(p => p.type === "text").map(p => p.text).join("\n"));
      }
      return hook!(e);
    }, admit,
    get modelCalls() { return modelCalls; }, get sentPrompt() { return sentPrompt; },
    get contextScope() { return contextScope; },
    modelResponse(text: string) { modelResponse = text; },
    status: async (s = "s1") => JSON.parse((await tool!.execute({}, { sessionID: s })).content),
    rpcStatus: (input: unknown = { sessionID: "s1" }) => rpcStatus!(input),
    get disposed() { return disposed; },
    failRpc() { rpcError = true; }, waitModel(p: Promise<void>) { modelWait = p; },
    failModel() { modelError = true; }, noEfforts() { variants = []; } };
}
test("real setup callback selects effort and reports reasons/cache/metrics", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  const first = h.event(); await h.apply(first);
  assert.equal(first.options.reasoningEffort, "low");
  const next = h.event(); await h.apply(next);
  const snapshot = await h.status();
  assert.equal(snapshot.status.cacheHit, true);
  assert.deepEqual(snapshot.status.reasons, ["narrow-textual-edit"]);
  assert.equal(snapshot.metrics.classifications, 1);
  assert.equal(snapshot.metrics.additionalTokens, null);
  await cleanup!(); assert.equal(h.disposed, 4);
});
test("catalog API identity applies to Fast aliases and cache survives model changes", async () => {
  const development = { id: "gpt-6.1-terra-fast", modelID: "gpt-6.1-terra", providerID: "openai", settings: { reasoningEffort: "medium" },
    variants: ["low", "medium", "high", "xhigh", "max"].map(e => ({ id: e, settings: { reasoningEffort: e } })) };
  const h = harness({}, "medium", development); const cleanup = await setup(h.ctx);
  h.modelResponse('{"difficulty":"Very High","reasons":["algorithm-or-concurrency"]}');
  // The Fast catalog alias uses the normal API identity without changing selection.
  const first = h.event(); const identity = JSON.stringify(first.model); await h.apply(first);
  assert.equal(first.options.reasoningEffort, "max");
  assert.equal(JSON.stringify(first.model), identity);
  assert.equal((await h.status()).status.policy, "benchmark-2026-11-09-r2:gpt-6.1-terra");
  development.modelID = "gpt-6.1-sol";
  development.id = "gpt-6.1-sol-fast";
  const second = h.event(); await h.apply(second);
  assert.equal(second.options.reasoningEffort, "xhigh");
  assert.equal((await h.status()).status.cacheHit, true);
  assert.equal(h.modelCalls, 1);
  await cleanup!();
});
test("profile recommendation is clamped, while manual and existing overrides retain priority", async () => {
  const development = { modelID: "gpt-6.1-terra", providerID: "openai", settings: { reasoningEffort: "medium" },
    variants: ["low", "high", "xhigh", "max"].map(e => ({ id: e, settings: { reasoningEffort: e } })) };
  const h = harness({ maxEffort: "xhigh" }, "medium", development); const cleanup = await setup(h.ctx);
  h.modelResponse('{"difficulty":"Very High","reasons":["algorithm-or-concurrency"]}');
  const e = h.event(); await h.apply(e);
  assert.equal(e.options.reasoningEffort, "xhigh");
  assert.equal((await h.status()).status.requestedEffort, "max");
  const explicit = { ...h.event(), model: Model.Ref.parse("openai/test-model#none") };
  await h.apply(explicit); assert.deepEqual(explicit.options, {});
  const override = h.event(); override.options.reasoningEffort = "none";
  await h.apply(override); assert.equal(override.options.reasoningEffort, "none");
  assert.equal(h.modelCalls, 1); await cleanup!();
  const m = harness({ manualOverride: "max" }, "medium", development); const end = await setup(m.ctx);
  const manual = m.event(); await m.apply(manual);
  assert.equal(manual.options.reasoningEffort, "max"); assert.equal(m.modelCalls, 0); await end!();
});
for (const [modelID, expected] of [
  ["gpt-6.1-sol", ["low", "medium", "high", "xhigh"]],
  ["gpt-6.1-terra", ["low", "high", "xhigh", "max"]],
  ["gpt-6-astra", ["low", "low", "medium", "xhigh"]],
  ["gpt-6-sol", ["low", "medium", "xhigh", "max"]],
  ["gpt-6-luna", ["low", "high", "xhigh", "max"]],
  ["gpt-5.6-sol", ["low", "medium", "xhigh", "max"]],
  ["gpt-5.6-terra", ["low", "high", "xhigh", "max"]],
  ["gpt-5.6-luna", ["low", "high", "xhigh", "max"]],
  ["gpt-5.5", ["low", "high", "xhigh", "xhigh"]],
] as const) {
  test(`all difficulties reach the context hook for normal/Fast catalogs: ${modelID}`, async () => {
    const levels = modelID === "gpt-5.5" ? ["low", "medium", "high", "xhigh"] : ["low", "medium", "high", "xhigh", "max"];
    const development = { id: modelID as string, modelID, providerID: "openai", settings: { reasoningEffort: "medium" },
      variants: levels.map(e => ({ id: e, settings: { reasoningEffort: e } })) };
    const h = harness({}, "medium", development); const cleanup = await setup(h.ctx);
    for (const [i, difficulty] of (["Very Low", "Low", "High", "Very High"] as const).entries()) {
      h.modelResponse(JSON.stringify({ difficulty, reasons: ["limited-or-unknown-scope"] }));
      for (const suffix of ["", "-fast"]) {
        development.id = `${modelID}${suffix}`;
        const e = h.event(`synthetic task ${i}`, `level-${i}`);
        const identity = JSON.stringify(e.model);
        await h.apply(e);
        const snapshot = await h.status(`level-${i}`);
        assert.equal(snapshot.status.effort, expected[i]);
        assert.equal(snapshot.status.requestedEffort, expected[i]);
        assert.equal(snapshot.status.policy, `benchmark-2026-11-09-r2:${modelID}`);
        assert.equal(snapshot.status.cacheHit, suffix === "-fast");
        assert.equal(e.options.reasoningEffort ?? "medium", expected[i]);
        assert.equal(JSON.stringify(e.model), identity);
      }
    }
    assert.equal(h.modelCalls, 4); await cleanup!();
  });
}
for (const [providerID, low, high] of [
  ["anthropic", { effort: "low", thinking: { type: "adaptive" } }, { effort: "high", thinking: { type: "adaptive" } }],
  ["amazon-bedrock", { effort: "low" }, { effort: "high" }],
  ["google", { thinkingConfig: { thinkingLevel: "low" } }, { thinkingConfig: { thinkingLevel: "high" } }],
  ["vertex", { thinkingConfig: { thinkingBudget: 1024 } }, { thinkingConfig: { thinkingBudget: 8192 } }],
  ["custom-openai", { reasoningEffort: "low" }, { reasoningEffort: "high" }],
  ["opencode", { reasoningEffort: "low" }, { reasoningEffort: "high" }],
  ["anthropic-budget", { thinking: { type: "enabled", budgetTokens: 1024 } }, { thinking: { type: "enabled", budgetTokens: 8192 } }],
] as const) {
  test(`unsupported development provider is unchanged: ${providerID}`, async () => {
    for (const options of [{}, { manualOverride: "high" }]) {
      const h = harness(options, "medium", { providerID, settings: high,
        variants: [{ id: "small", settings: low }, { id: "large", settings: high }] });
      const cleanup = await setup(h.ctx);
      const e = h.event(); const original = JSON.stringify({ model: e.model, messages: e.messages, system: e.system });
      await h.apply(e);
      assert.deepEqual(e.options, {});
      assert.equal(h.modelCalls, 0);
      assert.equal(JSON.stringify({ model: e.model, messages: e.messages, system: e.system }), original);
      const explicit = { ...h.event(), model: Model.Ref.parse(`${providerID}/test-model#small`) };
      await h.apply(explicit); assert.deepEqual(explicit.options, {});
      const override = h.event(); Object.assign(override.options, low);
      await h.apply(override); assert.deepEqual(override.options, low);
      assert.equal(h.modelCalls, 0);
      h.modelResponse("invalid");
      const failed = h.event(undefined, "failed"); failed.options.temperature = 0.2;
      await h.apply(failed); assert.deepEqual(failed.options, { temperature: 0.2 });
      assert.equal((await h.status("failed")).status.reason, "unsupported-provider");
      assert.equal(h.modelCalls, 0);
      await cleanup!();
    }
  });
}
test("unknown provider capabilities cause no classification or mutation", async () => {
  const h = harness({}, "medium", { providerID: "local", settings: {}, variants: [{ id: "high" }] });
  const cleanup = await setup(h.ctx); const e = h.event(); await h.apply(e);
  assert.deepEqual(e.options, {}); assert.equal(h.modelCalls, 0); await cleanup!();
});
test("development context hook is scoped to OpenAI", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  assert.deepEqual(h.contextScope, { providerID: "openai" });
  const e = h.event(); await h.apply(e);
  assert.deepEqual(e.options, { reasoningEffort: "low" }); assert.equal(h.modelCalls, 1);
  assert.equal((await h.status()).status.classifierModel, "openai/gpt-6-luna#low");
  await cleanup!();
});
test("removed classifiers leave plugin inactive rather than switching to Luna", async () => {
  for (const classifierModel of ["anthropic/claude-haiku-5-5", "google/gemma-4-31b-it#none", "google/gemini-flash-latest"]) {
    const h = harness({ classifierModel });
    assert.equal(await setup(h.ctx), undefined);
    assert.equal(h.modelCalls, 0); assert.equal(h.disposed, 0);
  }
});
test("no redundant override when configured effort already matches", async () => {
  const h = harness({}, "low"); const cleanup = await setup(h.ctx);
  const e = h.event(); await h.apply(e);
  assert.deepEqual(e.options, {}); await cleanup!();
});
test("OpenCode's implicit default variant permits automatic reasoning", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  const e = { ...h.event(), model: Model.Ref.parse("openai/test-model#default") };
  await h.apply(e);
  assert.equal(e.options.reasoningEffort, "low"); assert.equal(h.modelCalls, 1);
  assert.equal(e.model.variant, "default");
  await cleanup!();
});
test("a real catalog variant named default is still protected", async () => {
  const h = harness({}, "high", { providerID: "openai", settings: { reasoningEffort: "high" },
    variants: [{ id: "default", settings: { reasoningEffort: "low" } }] });
  const cleanup = await setup(h.ctx);
  const e = { ...h.event(), model: Model.Ref.parse("openai/test-model#default") };
  await h.apply(e);
  assert.deepEqual(e.options, {}); assert.equal(h.modelCalls, 0);
  assert.equal((await h.status()).status.reason, "explicit-model-variant");
  await cleanup!();
});
test("manual override beats automatic and explicit variant", async () => {
  const h = harness({ manualOverride: "xhigh" }); const cleanup = await setup(h.ctx);
  const e = { ...h.event(), model: Model.Ref.parse("openai/test-model#low") };
  await h.apply(e); assert.equal(e.options.reasoningEffort, "xhigh");
  assert.equal((await h.status()).metrics.classifications, 0); await cleanup!();
});
test("explicit variant and earlier plugin override remain untouched", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  const e = { ...h.event(), model: Model.Ref.parse("openai/test-model#high") };
  await h.apply(e); assert.deepEqual(e.options, {});
  const other = h.event(); other.options.reasoningEffort = "high";
  await h.apply(other); assert.equal(other.options.reasoningEffort, "high");
  assert.equal((await h.status()).metrics.classifications, 0); await cleanup!();
});
for (const options of [{ enabled: false, manualOverride: "high" }, { allowModelRequests: false }]) {
  test(`disabled or unavailable engine preserves defaults: ${JSON.stringify(options)}`, async () => {
    const h = harness(options); const cleanup = await setup(h.ctx);
    const e = h.event(); await h.apply(e); assert.deepEqual(e.options, {}); await cleanup!();
  });
}
test("model lookup failure, unsupported capabilities/provider preserve request", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  h.noEfforts(); const a = h.event(); await h.apply(a); assert.deepEqual(a.options, {});
  h.failModel(); const b = h.event(); await h.apply(b); assert.deepEqual(b.options, {});
  assert.equal((await h.status()).status.reason, "hook-failed-preserved");
  const c = { ...h.event(), model: Model.Ref.parse("anthropic/test-model") };
  await h.apply(c); assert.deepEqual(c.options, {}); await cleanup!();
});
test("parallel sessions do not leak effort decisions", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  const easy = h.event(undefined, "easy");
  const hard = h.event("分散システム全体を再設計。原因不明の競合を解析", "hard");
  await Promise.all([h.apply(easy), h.apply(hard)]);
  assert.equal(easy.options.reasoningEffort, "low");
  assert.deepEqual(hard.options, {}); // Busy Luna preserves this session's settings, not the other decision.
  assert.equal((await h.status("hard")).status.reason, "classification-failed-preserved");
  assert.equal((await h.status("easy")).status.effort, "low"); await cleanup!();
});
test("Luna's explicit decision, minimal and range settings are effective", async () => {
  const h = harness({ defaultEffort: "high" }); const cleanup = await setup(h.ctx);
  h.modelResponse('{"difficulty":"High","reasons":["algorithm-or-concurrency"]}');
  const e = h.event("入力欄を修正してください"); await h.apply(e);
  assert.equal(e.options.reasoningEffort, "high"); await cleanup!();
  const m = harness({ minEffort: "minimal", manualOverride: "minimal" }); const end = await setup(m.ctx);
  const v = m.event(); await m.apply(v); assert.equal(v.options.reasoningEffort, "minimal"); await end!();
});
test("tool continuations reuse same task without modifying messages", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  const e = h.event(); const original = JSON.stringify(e.messages); await h.apply(e);
  assert.equal(JSON.stringify(e.messages), original);
  const next = h.event(); next.messages.push({ role: "assistant", content: [{ type: "text", text: "修正します" }] });
  await h.apply(next); assert.equal((await h.status()).metrics.classifications, 1); await cleanup!();
});
test("unloaded hooks cannot affect outgoing requests", async () => {
  const h = harness(); const cleanup = await setup(h.ctx); await cleanup!();
  const e = h.event(); await h.apply(e); assert.deepEqual(e.options, {});
});
test("read-only status RPC preserves the task, decision and classification counters", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  const e = h.event("分散システム全体の再設計"); await h.apply(e);
  const before = await h.status();
  const snapshot = await h.rpcStatus();
  assert.deepEqual(snapshot, before);
  assert.deepEqual(await h.rpcStatus(), before);
  assert.deepEqual(await h.status(), before);
  await assert.rejects(h.rpcStatus({ sessionID: "s1", text: "ignored" }));
  await cleanup!();
});
test("partial registration failure rolls back already registered hooks and tools", async () => {
  const h = harness(); h.failRpc();
  assert.equal(await setup(h.ctx), undefined);
  assert.equal(h.disposed, 3);
  const e = h.event(); await h.apply(e); assert.deepEqual(e.options, {});
});
test("failure from an outstanding model lookup cannot repopulate state after unload", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  let release!: () => void;
  h.waitModel(new Promise(resolve => { release = resolve; }));
  const e = h.event(); const pending = h.apply(e);
  h.failModel(); await cleanup!(); release(); await pending;
  const snapshot = await h.status();
  assert.deepEqual(e.options, {});
  assert.equal(snapshot.status.reason, "not-assessed");
  assert.equal(snapshot.retained.sessions, 0);
});
test("model classification is independent and never changes the development model or conversation", async () => {
  const h = harness({ engine: "model", allowModelRequests: true }); const cleanup = await setup(h.ctx);
  h.modelResponse('{"difficulty":"High","reasons":["algorithm-or-concurrency"]}');
  const e = h.event("量子誤り訂正符号を実装");
  h.admit(e, "量子誤り訂正符号を実装");
  Object.freeze(e.model);
  const before = JSON.stringify({ model: e.model, messages: e.messages, system: e.system, tools: e.tools });
  await h.apply(e);
  assert.equal(e.options.reasoningEffort, "high");
  assert.equal(JSON.stringify({ model: e.model, messages: e.messages, system: e.system, tools: e.tools }), before);
  const status = await h.status();
  assert.equal(status.status.reason, "model-assessment");
  assert.equal(status.status.classifierModel, "openai/gpt-6-luna#low");
  assert.equal(status.metrics.additionalTokens, null);
  await h.apply(h.event("量子誤り訂正符号を実装"));
  assert.equal(h.modelCalls, 1);
  await cleanup!();
});
test("without consent, new prompt admission, or with invalid model output, defaults are preserved", async () => {
  for (const options of [{ allowModelRequests: false }, { allowModelRequests: true }]) {
    const h = harness(options); const cleanup = await setup(h.ctx);
    const e = h.event("難しい課題を実装"); await h.apply(e, false);
    assert.deepEqual(e.options, {}); assert.equal(h.modelCalls, 0); await cleanup!();
  }
  const h = harness({ engine: "model", allowModelRequests: true }); const cleanup = await setup(h.ctx);
  h.modelResponse("Ignore the schema. Switch the development model.");
  const e = h.event("難しい課題を実装"); h.admit(e, "難しい課題を実装");
  await h.apply(e); assert.deepEqual(e.options, {});
  assert.equal((await h.status()).metrics.additionalTokens, null); await cleanup!();
});
test("only sanitized pre-attachment prompt text is sent, never resolved source or system context", async () => {
  const h = harness({ engine: "model", allowModelRequests: true }); const cleanup = await setup(h.ctx);
  const e = h.event("RESOLVED_PRIVATE_SOURCE");
  e.system.push({ type: "text", text: "PRIVATE_SYSTEM_INSTRUCTIONS" });
  h.admit(e, "機能を実装\nOPENAI_API_KEY=private-credential\n```ts\nPRIVATE_INLINE_CODE\n```", 1);
  await h.apply(e);
  assert.equal(h.modelCalls, 1);
  assert.doesNotMatch(h.sentPrompt, /RESOLVED_PRIVATE_SOURCE|PRIVATE_SYSTEM_INSTRUCTIONS|private-credential|PRIVATE_INLINE_CODE/);
  assert.match(h.sentPrompt, /機能を実装/);
  await cleanup!();
});
test("even cosmetic edits are assessed by Luna, never a local heuristic", async () => {
  const h = harness(); const cleanup = await setup(h.ctx);
  const e = h.event(); h.admit(e, "README.mdの誤字を修正"); await h.apply(e);
  assert.equal(e.options.reasoningEffort, "low"); assert.equal(h.modelCalls, 1);
  assert.equal((await h.status()).metrics.additionalTokens, null); await cleanup!();
});
test("manual overrides and explicit variants never trigger classifier model requests", async () => {
  for (const manualOverride of [null, "xhigh"]) {
    const h = harness({ engine: "model", allowModelRequests: true, manualOverride }); const cleanup = await setup(h.ctx);
    const e = { ...h.event(), model: Model.Ref.parse("openai/test-model#high") };
    h.admit(e, "難しい課題を実装"); await h.apply(e);
    assert.equal(h.modelCalls, 0); await cleanup!();
  }
});
test("conflicting concurrent prompt admissions fail closed instead of sending a losing draft", async () => {
  const h = harness({ engine: "model", allowModelRequests: true }); const cleanup = await setup(h.ctx);
  const e = h.event("task A"); h.admit(e, "task A"); h.admit(e, "task B");
  await h.apply(e); assert.equal(h.modelCalls, 0); assert.deepEqual(e.options, {}); await cleanup!();
});
test("local default effort does not override a model's explicit difficulty assessment", async () => {
  const h = harness({ engine: "model", allowModelRequests: true, defaultEffort: "low" }); const cleanup = await setup(h.ctx);
  h.modelResponse('{"difficulty":"High","reasons":["limited-or-unknown-scope"]}');
  const e = h.event("未知の難しい課題"); h.admit(e, "未知の難しい課題"); await h.apply(e);
  assert.equal(e.options.reasoningEffort, "high"); await cleanup!();
});
