import { test } from "node:test";
import assert from "node:assert/strict";
import { defaults } from "../src/config.js";
import { MeasurementLog, measurementDisabled, sessionRef } from "../src/measurement.js";
import { Controller } from "../src/controller.js";
import type { Classifier } from "../src/classifier.js";

const classifier: Classifier = { id: "mock-luna", classify() {
  return { difficulty: "High", effort: "high", reasons: ["algorithm-or-concurrency"], additionalTokens: 0 };
} };
const task = { text: "SECRET_TASK_TEXT", previous: [], attachments: 0 };

test("session references are hashed, never the raw session ID", () => {
  const ref = sessionRef("session-123");
  assert.equal(ref.length, 16);
  assert.match(ref, /^[0-9a-f]{16}$/);
  assert.notEqual(ref, "session-123");
  assert.equal(ref, sessionRef("session-123"));
});

test("measurement is disabled by default and exposes no records", async () => {
  const c = new Controller(defaults, classifier);
  await c.assess("s", "m", task);
  assert.deepEqual(c.snapshot("s").measurement, measurementDisabled);
  c.close();
});

test("measurement log keeps only non-sensitive fields and stays bounded", () => {
  const log = new MeasurementLog(2);
  for (let i = 0; i < 5; i++) {
    log.decision({ at: new Date(i).toISOString(), session: sessionRef("s"),
      difficulty: "High", requestedEffort: "high", effort: "high",
      policy: "benchmark-2026-11-18-r2", reason: "model-assessment",
      cacheHit: false, durationMs: i, classifierModel: "openai/gpt-6-luna#low",
      modelID: "gpt-6.2-sol", mutated: true });
  }
  log.observed({ at: new Date().toISOString(), session: sessionRef("s"),
    tokens: { input: 10, output: 5, reasoning: 2, cacheRead: 1, cacheWrite: 0 }, cost: 0.001 });
  log.observed({ at: new Date().toISOString(), session: sessionRef("s"),
    tokens: null, cost: null });
  const snapshot = log.snapshot();
  assert.equal(snapshot.enabled, true);
  assert.equal(snapshot.decisions.length, 2);
  assert.equal(snapshot.usage.length, 2);
  assert.deepEqual(snapshot.retained, { decisions: 2, usage: 2 });
  const serialized = JSON.stringify(snapshot);
  assert.doesNotMatch(serialized, /SECRET|session-123|file:\/\/|\/private|sk-/);
  assert.equal(snapshot.decisions[0]!.session.length, 16);
  assert.equal(snapshot.usage[1]!.tokens, null);
  assert.equal(snapshot.usage[1]!.cost, null);
  log.clear();
  assert.deepEqual(log.snapshot().retained, { decisions: 0, usage: 0 });
});

test("controller records decisions and clears them on unload", async () => {
  const c = new Controller({ ...defaults, measurement: true, maxEntries: 4 }, classifier);
  c.recordDecision("s1", { at: new Date().toISOString(), difficulty: "High",
    requestedEffort: "high", effort: "xhigh", policy: "test", reason: "model-assessment",
    cacheHit: false, durationMs: 1, classifierModel: null, modelID: "gpt-6-sol", mutated: true });
  c.recordUsage("s1", { at: new Date().toISOString(),
    tokens: { input: 1, output: 2, reasoning: 0, cacheRead: 0, cacheWrite: 0 }, cost: 0.5 });
  assert.equal(c.snapshot("s1").measurement.enabled, true);
  assert.equal(c.snapshot("s1").measurement.decisions.length, 1);
  assert.equal(c.snapshot("s1").measurement.usage.length, 1);
  assert.equal(c.snapshot("s2").measurement.decisions.length, 1); // log is plugin-wide, read-only
  c.close();
  assert.deepEqual(c.snapshot("s1").measurement.retained, { decisions: 0, usage: 0 });
  assert.equal(c.snapshot("s1").measurement.decisions.length, 0);
});
