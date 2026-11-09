import { test } from "node:test";
import assert from "node:assert/strict";
import { Cache } from "../src/cache.js";
import { defaults, parseConfig, type Effort } from "../src/config.js";
import type { Classifier } from "../src/classifier.js";
import { Controller } from "../src/controller.js";
import { selectEffort, supportedEfforts } from "../src/reasoning.js";

const task = { text: "README.mdの誤字を修正", previous: [], attachments: 0 };
// Deterministic test double, never a production classification engine.
const mockClassifier: Classifier = { id: "mock-luna", classify(input) {
  return input.text === "changed instruction"
    ? { difficulty: "Very High", effort: "xhigh", reasons: ["architecture-design"], additionalTokens: 0 }
    : { difficulty: "Very Low", effort: "low", reasons: ["narrow-textual-edit"], additionalTokens: 0 };
} };
test("strict config rejects unsafe limits, misspellings and unknown efforts", () => {
  for (const c of [{ enabled: "false" }, { maxEntries: 0 }, { timeoutMs: Infinity },
    { minEffort: "high", maxEffort: "low" }, { engine: "imaginary" }, { defaultEffort: "unknown" },
    { debgu: true }, { toString: true }, null, []]) assert.throws(() => parseConfig(c));
  assert.deepEqual(parseConfig({}), defaults);
  assert.equal(defaults.engine, "model");
  assert.equal(defaults.timeoutMs, 15_000);
  for (const engine of ["local", "hybrid", "antigravity"]) assert.throws(() => parseConfig({ engine }));
  assert.throws(() => parseConfig({ classifierModel: "openai/gpt-6.1-terra#low" }));
});
test("capabilities use variant settings, not names or hardcoded model IDs", () => {
  assert.deepEqual(supportedEfforts({ variants: [{ settings: { reasoningEffort: "low" } },
    { settings: { reasoningEffort: "xhigh" } }, { settings: { reasoningEffort: "max" } }] }), ["low", "xhigh", "max"]);
  assert.deepEqual(supportedEfforts({ variants: [{}] }), []);
});
test("safe fallback and strict min/max across different models", () => {
  assert.equal(selectEffort("xhigh", ["low", "medium", "high"], defaults), "high");
  assert.equal(selectEffort("medium", ["low", "high"], defaults), "high");
  assert.equal(selectEffort("low", ["minimal"], defaults), undefined);
  assert.equal(selectEffort("minimal", ["minimal", "low"], { ...defaults, minEffort: "minimal" }), "minimal");
  assert.equal(selectEffort("high", ["low"], { ...defaults, minEffort: "medium" }), undefined);
});
test("TTL, LRU and capacity are deterministic", () => {
  let now = 0;
  const cache = new Cache<number>(2, 10, () => now);
  cache.set("a", 1); cache.set("b", 2); cache.get("a"); cache.set("c", 3);
  assert.equal(cache.get("b"), undefined);
  now = 10;
  assert.equal(cache.get("a"), undefined);
  cache.clear(); assert.equal(cache.size, 0);
});
test("cache and in-flight deduplication, isolated sessions, no tool-loop reclassification", async () => {
  const c = new Controller(defaults, mockClassifier);
  const values = await Promise.all(Array.from({ length: 30 }, () => c.assess("s1", "m1", task)));
  assert.ok(values.every(v => v.decision?.effort === "low"));
  assert.equal(c.metrics.classifications, 1);
  await c.assess("s1", "m1", task);
  assert.equal(c.metrics.classifications, 1);
  await c.assess("s2", "m1", task);
  await c.assess("s1", "m2", task);
  assert.equal(c.metrics.classifications, 3);
  c.close();
});
test("classification failure is cached without invoking a fallback engine", async () => {
  const c = new Controller(defaults, { id: "mock-failure", classify() { throw new Error("unavailable"); } });
  assert.equal((await c.assess("s", "m", task)).failed, true);
  assert.equal((await c.assess("s", "m", task)).cacheHit, true);
  assert.equal(c.metrics.failures, 1);
  c.close();
});
test("changed instruction content invalidates a cached decision", async () => {
  const c = new Controller(defaults, mockClassifier);
  await c.assess("s", "m", task);
  const next = await c.assess("s", "m", { ...task, text: "changed instruction" });
  assert.equal(next.cacheHit, false);
  assert.equal(next.decision?.effort, "xhigh");
  c.close();
});
test("pending request cap rejects excess work without launching engines", async () => {
  let calls = 0;
  const engine: Classifier = { id: "pending-cap", classify() { calls++; return new Promise(() => {}); } };
  const c = new Controller({ ...defaults, maxEntries: 1 }, engine);
  const first = c.assess("s", "m1", task);
  assert.equal((await c.assess("s", "m2", task)).failed, true);
  assert.equal(calls, 1);
  c.close(); await first;
});
test("timeout aborts cooperative engine and preserves classification failure", async () => {
  let aborted = false;
  const engine: Classifier = { id: "hanging", classify(_task, signal) {
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => {
      aborted = true; reject(new Error("aborted"));
    }, { once: true }));
  } };
  const c = new Controller({ ...defaults, timeoutMs: 10 }, engine);
  assert.equal((await c.assess("s", "m", task)).failed, true);
  assert.equal(aborted, true);
  c.close();
});
test("malformed engine output fails safely", async () => {
  const engine: Classifier = { id: "bad", classify() {
    return { effort: "invalid" as Effort, difficulty: "Low", reasons: [], additionalTokens: 0 };
  } };
  const c = new Controller(defaults, engine);
  assert.equal((await c.assess("s", "m", task)).failed, true);
  c.close();
});
test("unload cancels pending work and prevents retaining results", async () => {
  const engine: Classifier = { id: "pending", classify() { return new Promise(() => {}); } };
  const c = new Controller(defaults, engine);
  const pending = c.assess("s", "m", task);
  c.close();
  assert.equal((await pending).failed, true);
  assert.equal(c.snapshot("s").retained.cache, 0);
});
test("10,000 tasks/sessions retain bounded state", async () => {
  const c = new Controller({ ...defaults, maxEntries: 32 }, mockClassifier);
  for (let i = 0; i < 10_000; i++) {
    await c.assess(`s${i}`, "m", task);
    c.statuses.set(`s${i}`, { reason: "test" });
    c.usage.set(`s${i}`, { input: i });
  }
  assert.deepEqual(c.snapshot("s9999").retained, { cache: 32, pending: 0, sessions: 32, usage: 32 });
  c.close();
});
