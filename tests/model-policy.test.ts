import { test } from "node:test";
import assert from "node:assert/strict";
import { modelEffort } from "../src/model-policy.js";
import { defaults, parseConfig } from "../src/config.js";

const difficulties = ["Very Low", "Low", "High", "Very High"] as const;
const frontier = ["low", "medium", "high", "xhigh"] as const;
const compact = ["low", "low", "medium", "high"] as const;

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

for (const [modelID, expected] of [
  ["gpt-6.2-sol", ["low", "medium", "high", "max"]],
  ["gpt-6.2-astra", ["low", "medium", "high", "xhigh"]],
  ["gpt-5.4", ["low", "low", "medium", "xhigh"]],
  ["gpt-5.4-mini", ["low", "medium", "high", "xhigh"]],
  ["gpt-5.2", ["low", "medium", "high", "high"]],
] as const) {
  test(`versioned multi-benchmark policy (2026-11-18 r2): ${modelID}`, () => {
    assert.deepEqual(difficulties.map(d => modelEffort({ modelID }, d, defaults).effort), expected);
    assert.equal(modelEffort({ modelID }, "High", defaults).policy, `benchmark-2026-11-18-r2:${modelID}`);
    assert.equal(modelEffort({ modelID }, "Very High", { modelPolicy: "common" }).effort, "xhigh");
  });
}

for (const [modelID, expected] of [
  ["gpt-5.4-nano", ["low", "medium", "high", "xhigh"]],
  ["gpt-5.3-codex", ["low", "medium", "high", "xhigh"]],
  ["gpt-5.1", ["low", "medium", "high", "high"]],
  ["gpt-5", ["low", "low", "high", "high"]],
  ["gpt-5-mini", ["low", "low", "high", "high"]],
  ["gpt-5-nano", ["low", "low", "high", "high"]],
  ["o3", ["low", "medium", "high", "high"]],
] as const) {
  test(`versioned single-sweep policy (2026-11-18 r1): ${modelID}`, () => {
    assert.deepEqual(difficulties.map(d => modelEffort({ modelID }, d, defaults).effort), expected);
    assert.equal(modelEffort({ modelID }, "High", defaults).policy, `benchmark-2026-11-18-r1:${modelID}`);
    assert.equal(modelEffort({ modelID }, "Very High", { modelPolicy: "common" }).effort, "xhigh");
  });
}

for (const [modelID, expected] of [
  ["gpt-6-cyber", frontier],
  ["gpt-daybreak-red-latest", frontier],
  ["gpt-5.6-cyber", frontier],
  ["gpt-daybreak-blue-latest", frontier],
  ["gpt-5.6", frontier],
  ["gpt-5.5-pro", frontier],
  ["gpt-5.4-pro", frontier],
  ["gpt-5.2-pro", frontier],
  ["gpt-5-pro", frontier],
  ["o3-pro", frontier],
  ["gpt-5.3-codex-spark", compact],
] as const) {
  test(`versioned heuristic policy: ${modelID}`, () => {
    assert.deepEqual(difficulties.map(d => modelEffort({ modelID }, d, defaults).effort), expected);
    assert.equal(modelEffort({ modelID }, "High", defaults).policy, `heuristic-2026-11-18:${modelID}`);
    assert.equal(modelEffort({ modelID }, "Very High", { modelPolicy: "common" }).effort, "xhigh");
  });
}

test("every reasoning-capable catalog family has a named policy", () => {
  const covered = [
    "gpt-6.2-sol", "gpt-6.2-astra", "gpt-6-cyber", "gpt-6.1-terra", "gpt-6.1-sol",
    "gpt-6-luna", "gpt-6-sol", "gpt-6-astra", "gpt-daybreak-red-latest", "gpt-5.6-cyber",
    "gpt-daybreak-blue-latest", "gpt-5.6-sol", "gpt-5.6", "gpt-5.6-terra", "gpt-5.6-luna",
    "gpt-5.5-pro", "gpt-5.5", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-5.4-pro", "gpt-5.4",
    "gpt-5.3-codex", "gpt-5.3-codex-spark", "gpt-5.2", "gpt-5.2-pro", "gpt-5.1",
    "gpt-5-pro", "gpt-5", "gpt-5-mini", "gpt-5-nano", "o3-pro", "o3",
  ];
  for (const modelID of covered) {
    assert.doesNotMatch(modelEffort({ modelID }, "High", defaults).policy, /^common/);
  }
});

test("unknown identities use common policy without name guessing", () => {
  for (const modelID of [
    "unknown", "gpt-6.1-terra-fast", "gpt-6.2-sol-fast", "gpt-5.6-pro", "constructor", "__proto__", undefined]) {
    assert.deepEqual(difficulties.map(d => modelEffort({ modelID }, d, defaults).effort), ["low", "medium", "high", "xhigh"]);
    assert.equal(modelEffort({ modelID }, "High", defaults).policy, "common:no-model-evidence");
  }
});

test("models without reasoning variants remain outside the policy table", () => {
  for (const modelID of [
    "chat-latest", "gpt-audio-1.5", "gpt-5-search-api", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"]) {
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
