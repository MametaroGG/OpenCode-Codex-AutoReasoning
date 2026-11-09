import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Plugin } from "@opencode/plugin";
import { createModelClassifier } from "../src/model-classifier.js";
import { parseConfig } from "../src/config.js";
import { localClassifier } from "./baselines/local-classifier.js";
import { labels, summarize, type AccuracyCase, type AccuracyResult } from "./evaluation-metrics.js";

if (!process.argv.includes("--allow-live")) throw new Error("Requires --allow-live and explicit approval of up to 48 billed calls");
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "evaluation-results", "accuracy-v1");
const ledgerPath = path.join(directory, "ledger.jsonl");
const reportPath = path.join(directory, "report.json");
const casesText = await readFile(path.join(root, "tests/fixtures/accuracy-v1.json"), "utf8");
const cases = JSON.parse(casesText) as AccuracyCase[];
if (cases.length !== 24 || new Set(cases.map(c => c.id)).size !== 24 ||
    cases.some(c => !labels.includes(c.expected) || typeof c.text !== "string")) throw new Error("Invalid frozen dataset");
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const datasetHash = hash(casesText);
const classifierHash = hash(await readFile(path.join(root, "src/model-classifier.ts"), "utf8"));
const config = parseConfig({ engine: "model", allowModelRequests: true, maxModelRequests: 48, timeoutMs: 60_000 });
await mkdir(directory, { recursive: true });
// An existing ledger is deliberately not overwritten or retried. Every started call consumes the approval.
await writeFile(ledgerPath, JSON.stringify({ type: "manifest", datasetHash, classifierHash, model: config.classifierModel,
  callsApproved: 48, createdAt: new Date().toISOString(), note: "Synthetic inputs only. Expected labels never sent to the model." }) + "\n", { flag: "wx" });

function api(method: string, endpoint: string, body?: unknown): Promise<unknown> {
  // The official CLI handles connection discovery and authentication. Never resolve or read credentials.
  // Payload travels over stdin, not shell interpolation. No opencode run/session/tool execution.
  const command = body === undefined
    ? `opencode api ${method} ${endpoint}`
    : `[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)\n$body = [Console]::In.ReadToEnd()\nopencode api ${method} ${endpoint} --data $body`;
  return new Promise((resolve, reject) => {
    const child = spawn("pwsh", ["-NoProfile", "-NonInteractive", "-Command", command], { cwd: root,
      stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let output = "", size = 0, finished = false;
    const finish = (error?: Error) => {
      if (finished) return; finished = true; clearTimeout(timer);
      if (error) { reject(error); return; }
      try { resolve(JSON.parse(output.replace(/^\uFEFF/, ""))); } catch { reject(new Error("invalid-api-response")); }
    };
    const timer = setTimeout(() => {
      child.kill(); finish(new Error("api-timeout-stop-no-retry"));
    }, 60_000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      size += Buffer.byteLength(chunk);
      if (size > 1_000_000) { child.kill(); finish(new Error("api-output-limit")); }
      else output += chunk;
    });
    child.stderr.resume(); // Do not persist potentially sensitive SDK/provider diagnostic bodies.
    child.on("error", () => finish(new Error("api-process-failed")));
    child.on("close", code => finish(code === 0 ? undefined : new Error("api-request-failed")));
    child.stdin.on("error", () => {});
    child.stdin.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

const results: AccuracyResult[] = [];
let generated = 0;
try {
  const catalog = await api("get", "/api/model") as { data: { id: string; providerID: string; enabled: boolean;
    status: string; modelID: string; type?: string; variants: { id: string }[] }[] };
  const selected = catalog.data.find(m => m.providerID === "openai" && m.id === "gpt-6-luna");
  if (!selected?.enabled || !selected.variants.some(v => v.id === "low")) throw new Error("selected-model-unavailable");
  const metadata = { id: selected.id, modelID: selected.modelID, providerID: selected.providerID, enabled: selected.enabled,
    status: selected.status, type: selected.type, variants: selected.variants.map(v => ({ id: v.id })) };
  const ctx = {
    model: { list: async () => ({ data: [metadata] }) },
    experimental: { generate: { text: async (input: unknown) => {
      if (generated >= 48) throw new Error("approved-call-cap");
      generated++;
      await appendFile(ledgerPath, JSON.stringify({ type: "started", call: generated, at: new Date().toISOString() }) + "\n");
      const response = await api("post", "/api/experimental/generate/text", input) as { data?: { text?: unknown } };
      if (typeof response.data?.text !== "string") throw new Error("missing-generated-text");
      return { text: response.data.text };
    } } },
  } as unknown as Plugin.Context;
  const engine = createModelClassifier(ctx, config);
  // Separate passes prevent adjacent duplicate tasks from exaggerating repeatability.
  for (let repetition = 1; repetition <= 2; repetition++) {
    for (const item of cases) {
      const task = { text: item.text, previous: item.previous ?? [], attachments: 0,
        remoteInput: { text: item.text, previous: item.previous ?? [], attachments: 0 } };
      const local = await localClassifier.classify(task, new AbortController().signal);
      const started = performance.now();
      let actual: AccuracyResult["actual"] = null, error: string | undefined;
      try {
        const decision = await engine.classify(task, new AbortController().signal);
        actual = decision.difficulty;
      } catch { error = "classification-or-transport-failed"; }
      const result: AccuracyResult = { id: item.id, repetition, expected: item.expected, local: local.difficulty,
        actual, hybrid: local.reasons.length === 1 && local.reasons[0] === "narrow-textual-edit" ? local.difficulty : actual,
        durationMs: performance.now() - started, ...(error ? { error } : {}) };
      results.push(result);
      await appendFile(ledgerPath, JSON.stringify({ type: "result", ...result }) + "\n");
      console.log(`${generated}/48 ${item.id} repeat=${repetition} expected=${item.expected} actual=${actual ?? "ERROR"} ${Math.round(result.durationMs)}ms`);
      if (error) throw new Error("stopped-after-error-without-retry");
    }
  }
} catch {
  console.error("Evaluation stopped safely; inspect the recorded results. No automatic retry or model fallback.");
  process.exitCode = 1;
} finally {
  const times = results.map(r => r.durationMs).sort((a, b) => a - b);
  const percentile = (p: number) => times.length ? times[Math.min(times.length - 1, Math.ceil(times.length * p) - 1)] : null;
  const report = {
    datasetHash, classifierHash, model: config.classifierModel, callsStarted: generated, callsApproved: 48,
    completed: results.length === 48 && results.every(r => !r.error), generatedAt: new Date().toISOString(),
    local: summarize(results, "local"), modelResults: summarize(results, "actual"), hybridSimulated: summarize(results, "hybrid"),
    latency: { meanMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
      p50Ms: percentile(0.5), p95Ms: percentile(0.95), overProductionDefault3000ms: times.filter(t => t > 3000).length,
      note: "Includes CLI startup and transport overhead; not an exact in-process plugin latency measurement." },
    usageTokens: null, costUsd: null,
    limitations: ["24 subjective, author-labeled synthetic cases; no independent expert labels.",
      "Accuracy of difficulty labels, not downstream code quality or token savings.",
      "Real generation uses the official OpenCode API through a CLI bridge; not a live plugin-host integration test.",
      "Hybrid result is an offline simulation from the same real model responses.",
      "No usage metadata from this text API. Requests may consume subscription allowance rather than API credits.",
      "On timeout, the remote inference may continue; the evaluation stops and does not retry."],
    results,
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ callsStarted: generated, completed: report.completed,
    localAccuracy: report.local.accuracy, modelAccuracy: report.modelResults.accuracy,
    hybridAccuracy: report.hybridSimulated.accuracy, report: reportPath }));
}
