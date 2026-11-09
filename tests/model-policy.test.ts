import { test } from "node:test";
import assert from "node:assert/strict";
import { modelEffort } from "../src/model-policy.js";
import { defaults, parseConfig } from "../src/config.js";

const difficulties = ["Very Low", "Low", "High", "Very High"] as const;
for (const [modelID, expected] of [
  ["gpt-6-astra", ["low", "low", "medium", "xhigh"]],
  ["gpt-6.1-sol", ["low", "medium", "high", "xhigh"]],
  ["gpt-6.1-terra", ["low", "high", "xhigh", "max"]],
  ["gpt-6-luna", ["low", "high", "xhigh", "max"]],
  ["gpt-6-sol", ["low", "medium", "xhigh", "max"]],
  ["gpt-5.6-sol", ["low", "medium", "xhigh", "max"]],
  ["gpt-5.6-terra", ["low", "high", "xhigh", "max"]],
  ["gpt-5.6-luna", ["low", "high", "xhigh", "max"]],
  ["gpt-5.5", ["low", "high", "xhigh", "xhigh"]],
] as const) {
  test(`versioned benchmark policy: ${modelID}`, () => {
    assert.deepEqual(difficulties.map(d => modelEffort({ modelID }, d, defaults).effort), expected);
    assert.equal(modelEffort({ modelID }, "High", defaults).policy, `benchmark-2026-11-09-r2:${modelID}`);
    assert.equal(modelEffort({ modelID }, "Very High", { modelPolicy: "common" }).effort, "xhigh");
  });
}
test("unknown identities use common policy without name guessing", () => {
  for (const modelID of [
    "unknown", "gpt-6.1-terra-fast", "constructor", "__proto__", undefined]) {
    assert.deepEqual(difficulties.map(d => modelEffort({ modelID }, d, defaults).effort), ["low", "medium", "high", "xhigh"]);
    assert.equal(modelEffort({ modelID }, "High", defaults).policy, "common:no-model-evidence");
  }
});
test("policy and max config validation; none remains explicit-variant/request only", () => {
  assert.equal(parseConfig({ manualOverride: "max" }).manualOverride, "max");
  assert.equal(parseConfig({ maxEffort: "xhigh" }).maxEffort, "xhigh");
  assert.equal(parseConfig({ modelPolicy: "common" }).modelPolicy, "common");
  for (const options of [{ modelPolicy: "unknown" }, { manualOverride: "none" }, { minEffort: "max", maxEffort: "high" }]) {
    assert.throws(() => parseConfig(options));
  }
});
