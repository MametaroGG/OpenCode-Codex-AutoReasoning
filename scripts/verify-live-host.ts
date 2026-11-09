import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import type { AccuracyCase } from "./evaluation-metrics.js";

// Explicit user approval: two Luna decisions + two Sol turns, never auto-run in CI.
const setupRecheck = process.argv.length === 4 && process.argv[2] === "--allow-live" && process.argv[3] === "--setup-recheck";
const settlementRecheck = process.argv.length === 4 && process.argv[2] === "--allow-live" && process.argv[3] === "--settlement-recheck";
const defaultVariantFix = process.argv.length === 4 && process.argv[2] === "--allow-live" && process.argv[3] === "--default-variant-fix";
if (!setupRecheck && !settlementRecheck && !defaultVariantFix && (process.argv.length !== 3 || process.argv[2] !== "--allow-live")) throw new Error("Requires approval of at most four generations and --allow-live");
const root = fileURLToPath(new URL("../", import.meta.url));
const runID = defaultVariantFix ? "v4" : settlementRecheck ? "v3" : setupRecheck ? "v2" : "v1";
const location = `C:/Users/tyari/AppData/Local/Temp/opencode/auto-reasoning-host-${runID}`;
const directory = path.join(root, `evaluation-results/live-host-${runID}`);
const ledger = path.join(directory, "ledger.jsonl");
const configFile = path.join(location, "opencode.json");
const query = `?location[directory]=${encodeURIComponent(location)}`;
for (const previousID of defaultVariantFix ? ["v1", "v2", "v3"] : settlementRecheck ? ["v1", "v2"] : setupRecheck ? ["v1"] : []) {
  const previous = JSON.parse(await readFile(path.join(root, `evaluation-results/live-host-${previousID}/report.json`), "utf8"));
  const previousLedger = await readFile(path.join(root, `evaluation-results/live-host-${previousID}/ledger.jsonl`), "utf8");
  const guardedWithoutGenerations = previousID === "v3" && defaultVariantFix && previous.outcomes.length === 1 &&
    previous.outcomes[0].snapshot.classifier.modelUsage.requests === 0 &&
    previous.trace.some((t: any) => t.type === "context" && t.status.reason === "explicit-model-variant") &&
    !previous.trace.some((t: any) => t.type === "wire" || t.type === "response");
  if (!guardedWithoutGenerations && (previous.sessions.length || previous.outcomes.length || previousLedger.includes('"prompt-started"'))) {
    throw new Error("Setup recheck is allowed only when the original attempt made no prompts");
  }
}
await mkdir(directory, { recursive: true });
await writeFile(ledger, JSON.stringify({ type: "manifest", createdAt: new Date().toISOString(),
  developmentModel: "openai/gpt-6.1-sol", classifierModel: "openai/gpt-6-luna#low",
  maxGenerations: 4, maxLunaRequests: 2, maxDevelopmentTurns: 2, location,
  note: "Real OpenCode host. Synthetic tasks only; expected labels not sent. No global configuration changes or application-level retries. SDK internal retries not fully observable." }) + "\n", { flag: "wx" });

function api(method: string, endpoint: string, body?: unknown): Promise<any> {
  const command = body === undefined ? `opencode api ${method} '${endpoint}'` :
    `[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)\n$body = [Console]::In.ReadToEnd()\nopencode api ${method} '${endpoint}' --data $body`;
  return new Promise((resolve, reject) => {
    const child = spawn("pwsh", ["-NoProfile", "-NonInteractive", "-Command", command], { cwd: root, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let output = "", size = 0, finished = false;
    const finish = (error?: Error) => {
      if (finished) return; finished = true; clearTimeout(timer);
      if (error) { reject(error); return; }
      if (!output.trim()) { resolve(undefined); return; }
      try { resolve(JSON.parse(output.replace(/^\uFEFF/, ""))); } catch { reject(new Error("invalid-api-json")); }
    };
    const timer = setTimeout(() => { child.kill(); finish(new Error("api-timeout-no-retry")); }, 90_000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      size += Buffer.byteLength(chunk);
      if (size > 2_000_000) { child.kill(); finish(new Error("api-output-limit")); } else output += chunk;
    });
    child.stderr.resume(); // Do not output or save provider errors or credentials.
    child.on("error", () => finish(new Error("api-process-failed")));
    child.on("close", code => finish(code === 0 ? undefined : new Error("api-request-failed")));
    child.stdin.on("error", () => {});
    child.stdin.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

const config = { $schema: "https://opencode.ai/config.json", snapshots: false, warming: false,
  compaction: { auto: false }, default_agent: "auto-reasoning-test",
  agents: { "auto-reasoning-test": { mode: "primary", steps: 1,
    system: "Integration test; do not execute the task; reply only OK.", permissions: [{ action: "*", resource: "*", effect: "deny" }] } },
  providers: { openai: { settings: { transport: "http", encoding: "none", timeout: 60_000 } } },
  plugins: [
    { package: root.replaceAll("\\", "/"), options: { allowModelRequests: true, maxModelRequests: 2, timeoutMs: 15000 } },
    { package: path.join(root, "scripts/fixtures/live-host-observer").replaceAll("\\", "/") },
  ],
};
const sessions: string[] = [];
const outcomes: unknown[] = [];
let trace: unknown[] = [], plugins: unknown[] = [], completed = false, error: string | undefined, configCreated = false;
let stage = "setup";
try {
  await mkdir(location); // Exclusive location: never overwrite an existing project config.
  await writeFile(configFile, JSON.stringify(config, null, 2) + "\n", { flag: "wx" }); configCreated = true;
  const loaded = await api("get", `/api/plugin${query}`);
  stage = "location-and-plugin-check";
  await appendFile(ledger, JSON.stringify({ type: "loaded-location", directory: loaded.location.directory }) + "\n");
  assert.equal(path.resolve(loaded.location.directory).toLowerCase(), path.resolve(location).toLowerCase());
  plugins = loaded.data.map((p: any) => ({ id: p.id ?? null, status: p.state?.status ?? null }));
  await appendFile(ledger, JSON.stringify({ type: "plugins", plugins }) + "\n");
  stage = "initial-probe-rpc";
  const initial = await api("post", `/api/rpc/auto-reasoning-live-probe/read${query}`, { input: {} });
  assert.deepEqual(initial.output.trace, []);
  // The first list is an early registry snapshot, not a plugin-settlement barrier.
  const settled = await api("get", `/api/plugin${query}`);
  plugins = settled.data.map((p: any) => ({ id: p.id ?? null, status: p.state?.status ?? null }));
  await appendFile(ledger, JSON.stringify({ type: "settled-plugins", plugins }) + "\n");
  for (const id of ["auto-reasoning", "auto-reasoning-live-probe"]) assert.ok(settled.data.some((p: any) => p.id === id && p.state?.status === "active"), "Required plugin did not load");
  stage = "model-preflight";
  const catalog = await api("get", `/api/model${query}`);
  for (const id of ["gpt-6.1-sol", "gpt-6-luna"]) {
    const model = catalog.data.find((m: any) => m.providerID === "openai" && m.id === id);
    assert.ok(model?.enabled && model.modelID === id && model.variants.some((v: any) => v.id === "low"), "Requested model unavailable");
  }
  const fixture = JSON.parse(await readFile(path.join(root, "tests/fixtures/accuracy-v1.json"), "utf8")) as AccuracyCase[];
  for (const caseID of ["vl-01", "vh-01"]) {
    stage = `session-${caseID}`;
    const task = fixture.find(c => c.id === caseID)!;
    const created = await api("post", "/api/session", { title: `Auto Reasoning live test ${caseID}`,
      location: { directory: location }, agent: "auto-reasoning-test", model: { providerID: "openai", id: "gpt-6.1-sol" },
      permissions: [{ action: "*", resource: "*", effect: "deny" }] });
    const sessionID = created.data.id as string; sessions.push(sessionID);
    await appendFile(ledger, JSON.stringify({ type: "prompt-started", caseID, sessionID, at: new Date().toISOString() }) + "\n");
    stage = `prompt-${caseID}`;
    const prompt = await api("post", `/api/session/${sessionID}/prompt`, { text: task.text });
    await api("post", `/api/experimental/session/${sessionID}/wait`);
    const snapshot = (await api("post", `/api/rpc/auto-reasoning/status${query}`, { input: { sessionID } })).output;
    const probe = (await api("post", `/api/rpc/auto-reasoning-live-probe/read${query}`, { input: {} })).output;
    trace = probe.trace;
    const info = (await api("get", `/api/session/${sessionID}`)).data;
    const observed = { caseID, sessionID, promptMessageID: prompt.data.messageID ?? prompt.data.id,
      model: info.model, outcome: info.outcome, snapshot };
    outcomes.push(observed); await appendFile(ledger, JSON.stringify({ type: "result", ...observed, trace }) + "\n");
    stage = `assertions-${caseID}`;
    assert.equal(snapshot.status.reason, "model-assessment");
    assert.equal(snapshot.status.effort, caseID === "vl-01" ? "low" : "xhigh");
    assert.deepEqual(info.model, created.data.model);
    assert.equal(info.model.id, "gpt-6.1-sol"); assert.equal(info.model.providerID, "openai");
    assert.equal(info.outcome, "succeeded");
    const wire = probe.trace.filter((t: any) => t.type === "wire" && t.sessionID === sessionID);
    assert.equal(wire.length, 1); assert.equal(wire[0].effort, snapshot.status.effort);
    const before = snapshot.metrics.classifications;
    const readOnly = (await api("post", `/api/rpc/auto-reasoning/status${query}`, { input: { sessionID } })).output;
    assert.equal(readOnly.metrics.classifications, before);
    console.log(JSON.stringify({ caseID, effort: snapshot.status.effort, outcome: info.outcome, wireEffort: wire[0].effort }));
  }
  completed = true;
} catch (cause) {
  const allowed = ["api-timeout-no-retry", "invalid-api-json", "api-output-limit", "api-process-failed", "api-request-failed"];
  error = cause instanceof assert.AssertionError ? "integration-assertion-failed" :
    cause instanceof Error && allowed.includes(cause.message) ? cause.message : "integration-setup-or-execution-failed";
  console.error(error); process.exitCode = 1;
  try { trace = (await api("post", `/api/rpc/auto-reasoning-live-probe/read${query}`, { input: {} })).output.trace; } catch { /* Best effort; no generation. */ }
} finally {
  // Only stop our test sessions; never reload the service or touch existing sessions.
  for (const id of sessions) try { await api("post", `/api/session/${id}/interrupt`, { resume: false }); } catch { /* no retry */ }
  if (configCreated) {
    config.plugins[0]!.options = { allowModelRequests: false, maxModelRequests: 2, timeoutMs: 15000 };
    await writeFile(configFile, JSON.stringify(config, null, 2) + "\n");
  }
  const report = { completed, stage, ...(error ? { error } : {}), location, plugins, sessions, outcomes, trace,
    generatedAt: new Date().toISOString(), usageOfClassifier: null, costOfClassifier: null,
    limitations: ["Two synthetic turns; not a code quality or savings benchmark.", "Observer constrains system/tools/output length in the test location only.",
      "HTTP transport explicitly selected; native WebSocket and TUI rendering not tested.", "No application-level retry; provider-internal retries and exact classifier billing are unknown.",
      "Production files loaded from local built package; not installed tarball in this real-host test."] };
  await writeFile(path.join(directory, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ completed, error, report: path.join(directory, "report.json") }));
}
