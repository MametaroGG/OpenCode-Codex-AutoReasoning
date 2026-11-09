import { Controller } from "../src/controller.js";
import { defaults } from "../src/config.js";
import type { Classifier } from "../src/classifier.js";
import { parseModelDecision } from "../src/model-classifier.js";

// Offline infrastructure benchmark only. Not a local difficulty estimator or an accuracy eval.
const mockLuna: Classifier = { id: "mock-luna-response", classify() {
  return { ...parseModelDecision('{"difficulty":"Very Low","reasons":["narrow-textual-edit"]}', defaults.classifierModel),
    additionalTokens: 0 }; // No real model was invoked by this test double.
} };
const controller = new Controller(defaults, mockLuna);
const task = { text: "synthetic request", previous: [], attachments: 0 };
await controller.assess("cache", "same", task);
const cachedStarted = performance.now();
for (let i = 0; i < 10_000; i++) await controller.assess("cache", "same", task);
const cachedMs = performance.now() - cachedStarted;
global.gc?.();
const before = process.memoryUsage();
const started = performance.now();
for (let i = 0; i < 50_000; i++) {
  await controller.assess(`stress-${i}`, "m", task);
  controller.statuses.set(`stress-${i}`, { effort: "low", reason: "benchmark" });
}
const durationMs = performance.now() - started;
global.gc?.();
const after = process.memoryUsage();
console.log(JSON.stringify({
  scope: "Offline Luna-response validation/cache/state benchmark using a fixed test double. No accuracy or model latency claim.",
  runtime: process.version,
  cache: { requests: 10_000, totalMs: cachedMs, meanMs: cachedMs / 10_000 },
  stress: { tasks: 50_000, totalMs: durationMs, meanMs: durationMs / 50_000,
    gcAvailable: typeof global.gc === "function", heapDeltaBytes: after.heapUsed - before.heapUsed,
    rssDeltaBytes: after.rss - before.rss, retained: controller.snapshot("stress-49999").retained },
  actualModelCalls: 0, additionalTokens: 0,
}, null, 2));
controller.close();
