import type { Decision } from "./classifier.js";
import type { Config, Effort } from "./config.js";

type Difficulty = Decision["difficulty"];
type Profile = Readonly<Record<Difficulty, Effort>>;
const common: Profile = { "Very Low": "low", Low: "medium", High: "high", "Very High": "xhigh" };
// Policy choices, not measured optima for these difficulty labels.
// Evidence: docs/MODEL-POLICIES.md and docs/MULTI-BENCHMARK-REVIEW.md (2026-11-09 r2).
const profiles: Readonly<Record<string, Profile>> = {
  "gpt-6-astra": { "Very Low": "low", Low: "low", High: "medium", "Very High": "xhigh" },
  "gpt-6.1-sol": { "Very Low": "low", Low: "medium", High: "high", "Very High": "xhigh" },
  "gpt-6.1-terra": { "Very Low": "low", Low: "high", High: "xhigh", "Very High": "max" },
  "gpt-6-luna": { "Very Low": "low", Low: "high", High: "xhigh", "Very High": "max" },
  "gpt-6-sol": { "Very Low": "low", Low: "medium", High: "xhigh", "Very High": "max" },
  "gpt-5.6-sol": { "Very Low": "low", Low: "medium", High: "xhigh", "Very High": "max" },
  "gpt-5.6-terra": { "Very Low": "low", Low: "high", High: "xhigh", "Very High": "max" },
  "gpt-5.6-luna": { "Very Low": "low", Low: "high", High: "xhigh", "Very High": "max" },
  "gpt-5.5": { "Very Low": "low", Low: "high", High: "xhigh", "Very High": "xhigh" },
};

export function modelEffort(model: { readonly modelID?: string }, difficulty: Difficulty,
  config: Pick<Config, "modelPolicy">): { effort: Effort; policy: string } {
  // Use the catalog API identity, never strip guessed '-fast' suffixes.
  const profile = config.modelPolicy === "benchmark" && model.modelID && Object.hasOwn(profiles, model.modelID)
    ? profiles[model.modelID] : undefined;
  return { effort: (profile ?? common)[difficulty],
    policy: profile ? `benchmark-2026-11-09-r2:${model.modelID}` : config.modelPolicy === "common" ? "common" : "common:no-model-evidence" };
}
