import { efforts, isEffort, type Config, type Effort } from "./config.js";

export interface ModelMetadata {
  readonly variants: readonly { readonly settings?: Readonly<Record<string, unknown>> }[];
  readonly settings?: Readonly<Record<string, unknown>>;
}

// Preserve earlier overrides even if they use a different semantic spelling.
const otherReasoningKeys = ["effort", "thinking", "thinkingConfig", "thinkingBudget",
  "enableThinking", "reasoning", "outputConfig", "output_config"] as const;
export function hasReasoningOverride(options: Readonly<Record<string, unknown>>): boolean {
  return options.reasoningEffort !== undefined || otherReasoningKeys.some(key => options[key] !== undefined);
}

// OpenAI only. Variant names and model IDs are not proof of supported effort values.
export function supportedEfforts(model: ModelMetadata): Effort[] {
  const settings = [...model.variants.map(v => v.settings), model.settings];
  if (settings.some(s => s && otherReasoningKeys.some(key => s[key] !== undefined))) return [];
  return efforts.filter(e => settings.some(s => isEffort(s?.reasoningEffort) && s?.reasoningEffort === e));
}
export function selectEffort(desired: Effort, supported: readonly Effort[], config: Config): Effort | undefined {
  const allowed = efforts.filter(e => supported.includes(e) &&
    efforts.indexOf(e) >= efforts.indexOf(config.minEffort) &&
    efforts.indexOf(e) <= efforts.indexOf(config.maxEffort));
  if (!allowed.length) return;
  const target = Math.max(efforts.indexOf(config.minEffort),
    Math.min(efforts.indexOf(config.maxEffort), efforts.indexOf(desired)));
  // Prefer rounding up to preserve quality; otherwise use the greatest available level.
  return allowed.find(e => efforts.indexOf(e) >= target) ?? allowed.at(-1);
}
