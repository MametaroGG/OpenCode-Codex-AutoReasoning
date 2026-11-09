import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Plugin } from "@opencode/plugin";
import { createModelClassifier } from "../src/model-classifier.js";
import { defaults } from "../src/config.js";
import type { AccuracyCase } from "./evaluation-metrics.js";

// Each fixed mode has its own authorization and exclusive ledger. No implicit retries.
const keyRecheck = process.argv.length === 4 && process.argv[2] === "--allow-live" && process.argv[3] === "--31b-key-recheck";
const only31B = keyRecheck || (process.argv.length === 4 && process.argv[2] === "--allow-live" && process.argv[3] === "--31b-only");
if (!only31B && (process.argv.length !== 3 || process.argv[2] !== "--allow-live")) throw new Error("Requires explicit live approval and a supported evaluation mode");
const callsApproved = only31B ? 1 : 8;
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, keyRecheck ? "evaluation-results/gemma-31b-key-recheck-v1" :
  only31B ? "evaluation-results/gemma-31b-smoke-v1" : "evaluation-results/gemma-smoke-v1");
const ledger = path.join(directory, "ledger.jsonl");
const dataset = await readFile(path.join(root, "tests/fixtures/accuracy-v1.json"), "utf8");
const fixture = JSON.parse(dataset) as AccuracyCase[];
const cases = (only31B ? ["vl-01"] : ["vl-01", "lo-01", "hi-01", "vh-01"]).map(id => {
  const item = fixture.find(c => c.id === id);
  if (!item) throw new Error("Missing frozen case");
  return item;
});
const ids = only31B ? ["gemma-4-31b-it"] : ["gemma-4-26b-a4b-it", "gemma-4-31b-it"];
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
await mkdir(directory, { recursive: true });
await writeFile(ledger, JSON.stringify({ type: "manifest", callsApproved,
  models: ids.map(id => `google/${id}#none`), caseIDs: cases.map(c => c.id),
  datasetHash: hash(dataset), classifierHash: hash(await readFile(path.join(root, "src/model-classifier.ts"), "utf8")),
  createdAt: new Date().toISOString(),
  note: "Synthetic smoke test, not an accuracy benchmark. Same classifier prompt and strict parser; evaluation-only model selection bypasses production config allowlist. No expected labels sent. No retries or fallback." }) + "\n", { flag: "wx" });

// Official CLI handles discovery/authentication; no credentials are read or saved.
function api(method: string, endpoint: string, body?: unknown): Promise<unknown> {
  const command = body === undefined ? `opencode api ${method} ${endpoint}` :
    `[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)\n$body = [Console]::In.ReadToEnd()\nopencode api ${method} ${endpoint} --data $body`;
  return new Promise((resolve, reject) => {
    const child = spawn("pwsh", ["-NoProfile", "-NonInteractive", "-Command", command], {
      cwd: root, stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
    });
    let output = "", size = 0, finished = false;
    const finish = (error?: Error) => {
      if (finished) return; finished = true; clearTimeout(timer);
      if (error) { reject(error); return; }
      try { resolve(JSON.parse(output.replace(/^\uFEFF/, ""))); }
      catch { reject(new Error("invalid-api-response")); }
    };
    const timer = setTimeout(() => { child.kill(); finish(new Error("api-timeout")); }, 60_000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      size += Buffer.byteLength(chunk);
      if (size > 1_000_000) { child.kill(); finish(new Error("api-output-limit")); }
      else output += chunk;
    });
    child.stderr.resume(); // Never log provider exception bodies.
    child.on("error", () => finish(new Error("api-process-failed")));
    child.on("close", code => finish(code === 0 ? undefined : new Error("api-request-failed")));
    child.stdin.on("error", () => {});
    child.stdin.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

let calls = 0;
const results: { model: string; caseID: string; expected: string; actual: string | null; durationMs: number; error?: string }[] = [];
try {
  type CatalogModel = { id: string; modelID: string; providerID: string; enabled: boolean; status: string;
    type?: string; variants: { id: string }[]; cost: { input: number; output: number }[] };
  const catalog = await api("get", "/api/model") as { data: CatalogModel[] };
  const models = ids.map(id => {
    const m = catalog.data.find(m => m.id === id && m.providerID === "google");
    if (!m?.enabled || m.modelID !== id || m.type !== "chat" || m.status !== "active" ||
      !m.variants.some(v => v.id === "none") || !m.cost.length || m.cost.some(c => c.input !== 0 || c.output !== 0)) {
      throw new Error("free-model-preflight-failed");
    }
    return m;
  });
  for (const model of models) {
    const classifierModel = `google/${model.id}#none`;
    const ctx = {
      model: { list: async () => ({ data: [model] }) },
      experimental: { generate: { text: async (input: unknown) => {
        if (calls >= callsApproved) throw new Error("approved-call-cap");
        calls++;
        await appendFile(ledger, JSON.stringify({ type: "started", call: calls, model: classifierModel, at: new Date().toISOString() }) + "\n");
        const response = await api("post", "/api/experimental/generate/text", input) as { data?: { text?: unknown } };
        if (typeof response.data?.text !== "string") throw new Error("missing-text");
        return { text: response.data.text };
      } } },
    } as unknown as Plugin.Context;
    // Evaluation only: do not broaden production's allowlist before seeing results.
    const engine = createModelClassifier(ctx, { ...defaults, classifierModel, allowModelRequests: true, maxModelRequests: cases.length });
    for (const item of cases) {
      const started = performance.now();
      let actual: string | null = null, error: string | undefined;
      try {
        const decision = await engine.classify({ text: item.text, previous: [], attachments: 0,
          remoteInput: { text: item.text, previous: [], attachments: 0 } }, new AbortController().signal);
        actual = decision.difficulty;
      } catch (cause) {
        const safeErrors = ["api-request-failed", "api-process-failed", "api-timeout", "api-output-limit", "invalid-api-response", "missing-text", "Invalid classification"];
        error = cause instanceof Error && safeErrors.includes(cause.message) ? cause.message :
          cause instanceof SyntaxError ? "invalid-classification-json" : "classification-or-transport-failed";
      }
      const result = { model: classifierModel, caseID: item.id, expected: item.expected, actual,
        durationMs: performance.now() - started, ...(error ? { error } : {}) };
      results.push(result);
      await appendFile(ledger, JSON.stringify({ type: "result", ...result }) + "\n");
      console.log(JSON.stringify(result));
      if (error) throw new Error("stop-after-failure");
    }
  }
} catch {
  console.error("Stopped safely without retry or fallback; see report. Remote inference may continue after a timeout.");
  process.exitCode = 1;
} finally {
  const report = { callsApproved, callsStarted: calls, completed: results.length === callsApproved && results.every(r => !r.error),
    generatedAt: new Date().toISOString(), usageTokens: null, costUsd: null,
    pricing: "Official Gemma 4 pricing and OpenCode catalog show free input/output. Actual account billing not observed.",
    limitations: [`${cases.length} subjective, previously published synthetic task(s) per model; not an independent accuracy benchmark.`,
      "No repeats, adversarial or continuation tests. No downstream code quality or savings measurement.",
      "Latency includes CLI/transport overhead; production's 15-second deadline not exercised.",
      "Same classification prompt/parser, but no live plugin-host integration. Production allowlist unchanged.",
      "SDK/provider internal retries are not measured. No explicit retries by this script."], results };
  await writeFile(path.join(directory, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ callsStarted: calls, completed: report.completed, report: path.join(directory, "report.json") }));
}
