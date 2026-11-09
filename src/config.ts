export const efforts = ["minimal", "low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof efforts)[number];
export interface Config {
  enabled: boolean;
  engine: "model";
  modelPolicy: "benchmark" | "common";
  classifierModel: string;
  allowModelRequests: boolean;
  maxModelRequests: number;
  modelMaxInputChars: number;
  minEffort: Effort;
  maxEffort: Effort;
  defaultEffort: Effort;
  manualOverride: Effort | null;
  timeoutMs: number;
  cacheTtlMs: number;
  maxEntries: number;
  debug: boolean;
}
export const defaults: Config = {
  enabled: true, engine: "model", modelPolicy: "benchmark", minEffort: "low", maxEffort: "max",
  classifierModel: "openai/gpt-6-luna#low", allowModelRequests: false,
  maxModelRequests: 100, modelMaxInputChars: 2000,
  defaultEffort: "medium", manualOverride: null, timeoutMs: 15_000,
  cacheTtlMs: 30 * 60_000, maxEntries: 256, debug: false,
};
export function isEffort(value: unknown): value is Effort {
  return typeof value === "string" && (efforts as readonly string[]).includes(value);
}
// OpenCode parses the surrounding JSON/JSONC. Reject typos instead of silently enabling work.
export function parseConfig(input: unknown): Config {
  if (input === undefined) return { ...defaults };
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid options");
  const raw = input as Record<string, unknown>;
  for (const key of Object.keys(raw)) if (!Object.hasOwn(defaults, key)) throw new Error("Unknown option");
  const c = { ...defaults, ...raw } as Config;
  if (typeof c.enabled !== "boolean" || typeof c.debug !== "boolean" || typeof c.allowModelRequests !== "boolean") throw new Error("Invalid switch");
  if (c.engine !== "model") throw new Error("Only model classification is supported");
  if (c.modelPolicy !== "benchmark" && c.modelPolicy !== "common") throw new Error("Invalid model policy");
  if (typeof c.classifierModel !== "string" || c.classifierModel.length > 256 ||
      !/^(?:openai|opencode)\/gpt-6-luna(?:#[a-zA-Z0-9._-]+)?$/.test(c.classifierModel)) throw new Error("Only GPT-6 Luna classification is supported");
  if (![c.minEffort, c.maxEffort, c.defaultEffort].every(isEffort) ||
      (c.manualOverride !== null && !isEffort(c.manualOverride))) throw new Error("Invalid effort");
  if (efforts.indexOf(c.minEffort) > efforts.indexOf(c.maxEffort)) throw new Error("Invalid range");
  for (const [key, max] of [["timeoutMs", 60_000], ["cacheTtlMs", 86_400_000], ["maxEntries", 4096],
    ["maxModelRequests", 10_000], ["modelMaxInputChars", 8000]] as const) {
    if (!Number.isSafeInteger(c[key]) || c[key] < 1 || c[key] > max) throw new Error("Invalid limit");
  }
  return c;
}
