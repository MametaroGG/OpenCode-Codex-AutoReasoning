import { test } from "node:test";
import assert from "node:assert/strict";
import { supportedEfforts, hasReasoningOverride, selectEffort } from "../src/reasoning.js";
import { defaults } from "../src/config.js";

const model = (...settings: Record<string, unknown>[]) => ({ variants: settings.map(settings => ({ settings })) });
test("only advertised OpenAI reasoningEffort values are supported", () => {
  assert.deepEqual(supportedEfforts(model({ reasoningEffort: "low" }, { reasoningEffort: "high" })), ["low", "high"]);
});
test("non-OpenAI semantic settings are not adapted", () => {
  for (const settings of [{ effort: "low" }, { thinking: { type: "adaptive" } },
    { thinkingConfig: { thinkingLevel: "low" } }, { thinking: { type: "enabled", budgetTokens: 1024 } }]) {
    assert.deepEqual(supportedEfforts(model(settings)), []);
  }
});
test("no synthetic effort levels are inferred from token budgets", () => {
  assert.deepEqual(supportedEfforts(model({ thinkingConfig: { thinkingBudget: 1024 } },
    { thinkingConfig: { thinkingBudget: 8192 } })), []);
});
test("mixed semantic settings and unknown levels fail closed", () => {
  assert.deepEqual(supportedEfforts(model({ reasoningEffort: "low" }, { effort: "high" })), []);
  assert.deepEqual(supportedEfforts(model({ reasoningEffort: "max" })), []);
  assert.deepEqual(supportedEfforts({ variants: [{ settings: {} }] }), []);
});
test("all explicit reasoning overrides remain protected", () => {
  for (const key of ["reasoningEffort", "effort", "thinking", "thinkingConfig", "thinkingBudget", "enableThinking", "reasoning", "outputConfig", "output_config"]) {
    assert.equal(hasReasoningOverride({ [key]: false }), true);
  }
  assert.equal(hasReasoningOverride({ temperature: 0.2, reasoningEffort: undefined }), false);
});
test("OpenAI range constraints and fallback remain effective", () => {
  assert.equal(selectEffort("xhigh", ["low", "high"], defaults), "high");
  assert.equal(selectEffort("low", ["minimal"], defaults), undefined);
});
