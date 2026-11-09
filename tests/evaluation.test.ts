import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { summarize, labels, type AccuracyResult, type AccuracyCase } from "../scripts/evaluation-metrics.js";

test("evaluation reports invalid outputs and severe underestimates without inflating accuracy", () => {
  const results: AccuracyResult[] = [
    { id: "a", repetition: 1, expected: "Very High", local: "Low", actual: "Low", hybrid: "Low", durationMs: 10 },
    { id: "b", repetition: 1, expected: "Low", local: "Low", actual: "Low", hybrid: "Low", durationMs: 10 },
    { id: "c", repetition: 1, expected: "High", local: "Low", actual: null, hybrid: null, durationMs: 10 },
  ];
  const summary = summarize(results, "actual");
  assert.equal(summary.accuracy, 1 / 3);
  assert.equal(summary.validOnlyAccuracy, 1 / 2);
  assert.equal(summary.severeUnder, 1);
  assert.equal(summary.hardUnderRate, 1 / 2);
  assert.equal(summary.confusion.High!.error, 1);
});
test("repeatability counts differing answers and invalid pairs as unstable", () => {
  const base: AccuracyResult = { id: "a", repetition: 1, expected: "High", local: "High", actual: "High", hybrid: "High", durationMs: 1 };
  const results = [base, { ...base, repetition: 2, actual: "Low" as const },
    { ...base, id: "b" }, { ...base, id: "b", repetition: 2 }];
  assert.deepEqual(summarize(results, "actual").repeatability, { pairedCases: 2, consistent: 1, rate: 0.5 });
});
test("frozen accuracy set has 24 unique synthetic tasks balanced across all four levels", async () => {
  const cases = JSON.parse(await readFile(new URL("./fixtures/accuracy-v1.json", import.meta.url), "utf8")) as AccuracyCase[];
  assert.equal(cases.length, 24);
  assert.equal(new Set(cases.map(c => c.id)).size, 24);
  for (const label of labels) assert.equal(cases.filter(c => c.expected === label).length, 6);
});
