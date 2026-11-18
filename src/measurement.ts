import { createHash } from "node:crypto";
import type { Decision } from "./classifier.js";
import type { Effort } from "./config.js";

/** Local-only, bounded evidence records. Never contains prompt text, file paths or credentials. */
export interface DecisionRecord {
  at: string;
  session: string; // truncated sha256, never the raw session ID
  difficulty: Decision["difficulty"] | null;
  requestedEffort: Effort | null;
  effort: Effort | null;
  policy: string | null;
  reason: string;
  cacheHit: boolean | null;
  durationMs: number | null;
  classifierModel: string | null;
  modelID: string | null;
  mutated: boolean;
}
export interface UsageRecord {
  at: string;
  session: string;
  tokens: { input: number; output: number; reasoning: number; cacheRead: number; cacheWrite: number } | null;
  cost: number | null;
}
export interface MeasurementSnapshot {
  enabled: boolean;
  decisions: readonly DecisionRecord[];
  usage: readonly UsageRecord[];
  retained: { decisions: number; usage: number };
}
function text(value: unknown, max = 128): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}
function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function sessionRef(sessionID: string): string {
  return createHash("sha256").update(sessionID).digest("hex").slice(0, 16);
}
function append<T>(target: T[], record: T, limit: number): void {
  target.push(record);
  if (target.length > limit) target.shift();
}
export class MeasurementLog {
  private readonly decisions: DecisionRecord[] = [];
  private readonly usage: UsageRecord[] = [];
  constructor(private readonly limit: number) {}
  decision(record: DecisionRecord): void {
    append(this.decisions, {
      ...record,
      reason: text(record.reason) ?? "unknown",
      policy: text(record.policy),
      classifierModel: text(record.classifierModel),
      modelID: text(record.modelID),
      durationMs: number(record.durationMs),
    }, this.limit);
  }
  observed(record: UsageRecord): void {
    const tokens = record.tokens;
    append(this.usage, {
      at: text(record.at, 32) ?? new Date(0).toISOString(),
      session: text(record.session, 16) ?? "unknown",
      tokens: tokens ? {
        input: number(tokens.input) ?? 0, output: number(tokens.output) ?? 0,
        reasoning: number(tokens.reasoning) ?? 0,
        cacheRead: number(tokens.cacheRead) ?? 0, cacheWrite: number(tokens.cacheWrite) ?? 0,
      } : null,
      cost: number(record.cost),
    }, this.limit);
  }
  snapshot(): MeasurementSnapshot {
    return { enabled: true, decisions: [...this.decisions], usage: [...this.usage],
      retained: { decisions: this.decisions.length, usage: this.usage.length } };
  }
  clear(): void {
    this.decisions.length = 0;
    this.usage.length = 0;
  }
}
export const measurementDisabled: MeasurementSnapshot = {
  enabled: false, decisions: [], usage: [], retained: { decisions: 0, usage: 0 },
};
