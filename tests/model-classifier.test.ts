import { test } from "node:test";
import assert from "node:assert/strict";
import { Model, type Plugin } from "@opencode/plugin";
import { parseConfig } from "../src/config.js";
import { createModelClassifier, parseModelDecision } from "../src/model-classifier.js";
import { boundedModelInput, sanitizePrompt } from "../src/privacy.js";
import { Controller } from "../src/controller.js";

const response = '{"difficulty":"Very High","reasons":["specialist-system-construction"]}';
const task = { text: "新規実装", previous: [], attachments: 0,
  remoteInput: { text: "新規実装", previous: [], attachments: 0 } };
function harness(options: Record<string, unknown> = {}) {
  let calls = 0;
  let available = true;
  let text = response;
  let waiter: Promise<{ text: string }> | undefined;
  const config = parseConfig({ engine: "model", allowModelRequests: true, ...options });
  const selected = Model.Ref.parse(config.classifierModel);
  let modelID: string = selected.id;
  const ctx = {
    model: { list: async () => ({ data: available ? [{ id: selected.id, modelID, providerID: selected.providerID, type: "chat",
      enabled: true, status: "active", variants: [{ id: "low" }] }] : [] }) },
    experimental: { generate: { text: async (input: { model: unknown }) => {
      assert.deepEqual(input.model, selected); calls++; return waiter ?? { text };
    } } },
  } as unknown as Plugin.Context;
  return { engine: createModelClassifier(ctx, config), config,
    get calls() { return calls; }, unavailable() { available = false; }, aliasToAnotherModel() { modelID = "gpt-6.1-sol"; },
    response(value: string) { text = value; }, wait(value: Promise<{ text: string }>) { waiter = value; } };
}
test("strict model schema rejects prose, extra fields, unknown reasons and oversized output", () => {
  assert.equal(parseModelDecision(response, "openai/gpt-6-luna").effort, "xhigh");
  for (const output of ["```json\n{}\n```", "null", "[]", '{}',
    '{"difficulty":"Very High","reasons":["secret-user-prompt"]}',
    '{"difficulty":"Low","reasons":[],"model":"other"}', "x".repeat(2049)]) {
    assert.throws(() => parseModelDecision(output, "openai/gpt-6-luna"));
  }
});
test("model selector and consent flags are validated without contacting providers", () => {
  assert.equal(parseConfig({}).timeoutMs, 15_000);
  for (const options of [{ classifierModel: "https://not-a-model" }, { classifierModel: "openai/model#variant#other" },
    { allowModelRequests: "true" }, { maxModelRequests: 0 }, { modelMaxInputChars: 9000 }]) {
    assert.throws(() => parseConfig(options));
  }
});
test("prompt minimization redacts common credentials and code, with an aggregate character cap", () => {
  const input = "作業\napiKey=secret-value\nGITHUB_TOKEN=private\nBearer private\n```ts\nsource-code\n```";
  assert.doesNotMatch(sanitizePrompt(input, 2000), /secret-value|source-code|Bearer private|=private/);
  const bounded = boundedModelInput("x".repeat(1500), ["a".repeat(600), "b".repeat(600)], 2, 2000);
  assert.ok(bounded.text.length + bounded.previous.join("").length <= 2000);
});
test("only selected catalog model is used; unavailable model never silently falls back", async () => {
  const h = harness(); h.unavailable();
  await assert.rejects(Promise.resolve(h.engine.classify(task, new AbortController().signal)));
  assert.equal(h.calls, 0);
});
test("a Luna catalog ID aliased to a different API model is rejected", async () => {
  const h = harness(); h.aliasToAnotherModel();
  await assert.rejects(Promise.resolve(h.engine.classify(task, new AbortController().signal)));
  assert.equal(h.calls, 0);
});
for (const classifierModel of ["anthropic/claude-haiku-5-5", "opencode/claude-haiku-5-5#low"]) {
  test(`non-Luna classifier is rejected before contacting a provider: ${classifierModel}`, () => {
    assert.throws(() => harness({ classifierModel }), /Only GPT-6 Luna/);
  });
}
test("unknown usage is not presented as zero, including failed responses", async () => {
  const h = harness(); h.response("invalid");
  const c = new Controller(h.config, h.engine);
  assert.equal((await c.assess("s", "m", task)).failed, true);
  assert.equal(c.snapshot("s").metrics.additionalTokens, null);
  assert.equal(c.snapshot("s").classifier.modelUsage?.requests, 1); c.close();
});
test("model-request cap applies to attempts, including invalid outputs", async () => {
  const h = harness({ maxModelRequests: 1 }); h.response("invalid");
  const c = new Controller(h.config, h.engine);
  await c.assess("s", "m1", task); await c.assess("s", "m2", task);
  assert.equal(h.calls, 1); assert.equal(h.engine.statistics?.().blocked, 1); c.close();
});
test("timeout keeps a non-cooperative model request reserved until it settles", async () => {
  const h = harness({ timeoutMs: 10 }); let release!: (value: { text: string }) => void;
  h.wait(new Promise(resolve => { release = resolve; }));
  const c = new Controller(h.config, h.engine);
  assert.equal((await c.assess("s", "m1", task)).failed, true);
  assert.equal(h.engine.statistics?.().inFlight, 1);
  assert.equal((await c.assess("s", "m2", task)).failed, true);
  assert.equal(h.calls, 1);
  release({ text: response }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.engine.statistics?.().inFlight, 0); c.close();
});
test("aborted calls and missing pre-attachment input never invoke a model", async () => {
  const h = harness(); const aborted = new AbortController(); aborted.abort();
  await assert.rejects(Promise.resolve(h.engine.classify(task, aborted.signal)));
  await assert.rejects(Promise.resolve(h.engine.classify({ text: "resolved source", previous: [], attachments: 0 }, new AbortController().signal)));
  assert.equal(h.calls, 0);
});
