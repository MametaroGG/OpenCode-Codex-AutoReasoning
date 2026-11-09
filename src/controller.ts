import { createHash } from "node:crypto";
import { Cache } from "./cache.js";
import { isEffort, type Config, type Effort } from "./config.js";
import { type Classifier, type Decision, type Task } from "./classifier.js";

export interface Assessment {
  decision?: Decision;
  cacheHit: boolean;
  durationMs: number;
  failed: boolean;
}
export interface Status {
  effort?: Effort;
  reason: string;
  reasons?: string[];
  difficulty?: Decision["difficulty"];
  cacheHit?: boolean;
  durationMs?: number;
  classifierModel?: string;
}
export class Controller {
  private cache: Cache<Assessment>;
  private pending = new Map<string, Promise<Assessment>>();
  private aborts = new Set<AbortController>();
  readonly statuses: Cache<Status>;
  readonly usage: Cache<unknown>;
  readonly metrics = { classifications: 0, cacheHits: 0, failures: 0, durationMs: 0, additionalTokens: 0 as number | null };
  private closed = false;
  constructor(readonly config: Config, private engine: Classifier) {
    this.cache = new Cache(config.maxEntries, config.cacheTtlMs);
    this.statuses = new Cache(config.maxEntries, config.cacheTtlMs);
    this.usage = new Cache(config.maxEntries, config.cacheTtlMs);
  }
  async assess(sessionID: string, taskID: string, task: Task): Promise<Assessment> {
    const key = createHash("sha256").update(JSON.stringify([sessionID, taskID, this.engine.id, task])).digest("hex");
    const cached = this.cache.get(key);
    if (cached) { this.metrics.cacheHits++; return { ...cached, cacheHit: true }; }
    const existing = this.pending.get(key);
    if (existing) { this.metrics.cacheHits++; return { ...await existing, cacheHit: true }; }
    if (this.closed || this.pending.size >= this.config.maxEntries) {
      return { failed: true, cacheHit: false, durationMs: 0 };
    }
    const promise = this.run(task);
    this.pending.set(key, promise);
    try {
      const result = await promise;
      if (!this.closed) this.cache.set(key, result); // Cache failures too, avoiding repeated errors.
      return result;
    } finally { this.pending.delete(key); }
  }
  private async run(task: Task): Promise<Assessment> {
    const started = performance.now();
    const controller = new AbortController();
    this.aborts.add(controller);
    this.metrics.classifications++;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const failure = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(new Error("Classification aborted")), { once: true });
      timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    });
    try {
      const decision = await Promise.race([
        Promise.resolve().then(() => {
          if (controller.signal.aborted) throw new Error("Classification aborted");
          return this.engine.classify(task, controller.signal);
        }), failure,
      ]);
      if (performance.now() - started > this.config.timeoutMs || !isEffort(decision.effort) ||
          !["Very Low", "Low", "High", "Very High"].includes(decision.difficulty) ||
          !Array.isArray(decision.reasons) || decision.reasons.some(r => typeof r !== "string") ||
          (decision.additionalTokens !== null &&
            (!Number.isFinite(decision.additionalTokens) || decision.additionalTokens < 0))) throw new Error("Invalid classification");
      const durationMs = performance.now() - started;
      this.metrics.durationMs += durationMs;
      if (decision.additionalTokens === null) this.metrics.additionalTokens = null;
      else if (this.metrics.additionalTokens !== null) this.metrics.additionalTokens += decision.additionalTokens;
      return { decision, durationMs, failed: false, cacheHit: false };
    } catch {
      this.metrics.failures++;
      const durationMs = performance.now() - started;
      this.metrics.durationMs += durationMs;
      return { durationMs, failed: true, cacheHit: false };
    } finally {
      clearTimeout(timer);
      this.aborts.delete(controller);
      if ((this.engine.statistics?.().requests ?? 0) > 0) this.metrics.additionalTokens = null;
    }
  }
  snapshot(sessionID: string) {
    return { status: this.statuses.get(sessionID) ?? { reason: "not-assessed" },
      classifier: { id: this.engine.id, modelUsage: this.engine.statistics?.() ?? null },
      metrics: { ...this.metrics }, usage: this.usage.get(sessionID) ?? null,
      retained: { cache: this.cache.size, pending: this.pending.size, sessions: this.statuses.size, usage: this.usage.size } };
  }
  close(): void {
    this.closed = true;
    for (const abort of this.aborts) abort.abort();
    this.cache.clear(); this.statuses.clear(); this.usage.clear(); this.pending.clear();
  }
}
