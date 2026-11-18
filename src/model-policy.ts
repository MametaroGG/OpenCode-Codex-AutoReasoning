import type { Decision } from "./classifier.js";
import type { Config, Effort } from "./config.js";

type Difficulty = Decision["difficulty"];
type Profile = Readonly<Record<Difficulty, Effort>>;
const common: Profile = { "Very Low": "low", Low: "medium", High: "high", "Very High": "xhigh" };

// Evidence-backed policies. Each row was compared against the primary reports
// listed in docs/MODEL-POLICIES.md; these are policy choices, not measured
// optima for the four local difficulty labels.
const measuredVersion = "benchmark-2026-11-09-r2";
const measured: Readonly<Record<string, Profile>> = {
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

// Catalog families without a published effort sweep. These are deliberately
// conservative, capability-class choices so every reasoning-capable OpenAI
// model has a named policy instead of silently sharing the common fallback.
// They are not benchmark results and must stay labelled as heuristic.
const heuristicVersion = "heuristic-2026-11-18";
const frontier: Profile = { "Very Low": "low", Low: "medium", High: "high", "Very High": "xhigh" };
const compact: Profile = { "Very Low": "low", Low: "low", High: "medium", "Very High": "high" };
const heuristic: Readonly<Record<string, Profile>> = {
  "gpt-6.2-sol": frontier,
  "gpt-6.2-astra": frontier,
  "gpt-6-cyber": frontier,
  "gpt-daybreak-red-latest": frontier,
  "gpt-5.6-cyber": frontier,
  "gpt-daybreak-blue-latest": frontier,
  "gpt-5.6": frontier,
  "gpt-5.5-pro": frontier,
  "gpt-5.4-pro": frontier,
  "gpt-5.4": frontier,
  "gpt-5.4-mini": compact,
  "gpt-5.4-nano": compact,
  "gpt-5.3-codex": frontier,
  "gpt-5.3-codex-spark": compact,
  "gpt-5.2-pro": frontier,
  "gpt-5.2": frontier,
  "gpt-5.1": frontier,
  "gpt-5-pro": frontier,
  "gpt-5": frontier,
  "gpt-5-mini": compact,
  "gpt-5-nano": compact,
  "o3-pro": frontier,
  "o3": frontier,
};

function findProfile(modelID: string | undefined): { profile: Profile; policy: string } | undefined {
  if (!modelID) return;
  if (Object.hasOwn(measured, modelID)) {
    const profile = measured[modelID];
    if (profile) return { profile, policy: `${measuredVersion}:${modelID}` };
  }
  if (Object.hasOwn(heuristic, modelID)) {
    const profile = heuristic[modelID];
    if (profile) return { profile, policy: `${heuristicVersion}:${modelID}` };
  }
}

export function modelEffort(model: { readonly modelID?: string }, difficulty: Difficulty,
  config: Pick<Config, "modelPolicy">): { effort: Effort; policy: string } {
  // Use the catalog API identity, never strip guessed '-fast' suffixes.
  const found = config.modelPolicy === "benchmark" ? findProfile(model.modelID) : undefined;
  return { effort: (found?.profile ?? common)[difficulty],
    policy: found?.policy ?? (config.modelPolicy === "common" ? "common" : "common:no-model-evidence") };
}
