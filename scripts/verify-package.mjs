import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Development-only check. npm supplies its own CLI path; no shell, tokens or project files are collected.
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run this check through npm run verify:package");
const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(path.join(root, ".package-smoke-"));
function run(args, cwd = root) {
  return execFileSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024 });
}
try {
  const packed = JSON.parse(run([npm, "pack", "--json", "--ignore-scripts", "--pack-destination", temporary]));
  if (packed[0].files.some(file => /antigravity\.(?:js|d\.ts)$/.test(file.path) || file.path.startsWith("scripts/baselines/"))) {
    throw new Error("Removed classification engines must not be distributed");
  }
  const archive = path.join(temporary, path.basename(packed[0].filename));
  const consumer = path.join(temporary, "consumer");
  await mkdir(consumer);
  // Seed the dependency lock to test the same audited versions, not newly resolved peers.
  const sourcePackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
  lock.name = "auto-reasoning-smoke";
  lock.packages[""].name = lock.name;
  await writeFile(path.join(consumer, "package.json"), JSON.stringify({
    name: lock.name, private: true, type: "module",
    dependencies: sourcePackage.dependencies, devDependencies: sourcePackage.devDependencies,
  }));
  await writeFile(path.join(consumer, "package-lock.json"), JSON.stringify(lock));
  // Offline install deliberately forbids network access and dependency lifecycle scripts.
  run([npm, "install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", "--omit=optional", "--omit=dev", archive], consumer);
  const installed = JSON.parse(await readFile(path.join(consumer, "node_modules/opencode-auto-reasoning/package.json"), "utf8"));
  if (installed.license !== "MIT") throw new Error("Missing MIT metadata");
  const license = await readFile(path.join(consumer, "node_modules/opencode-auto-reasoning/LICENSE"), "utf8");
  if (!license.startsWith("MIT License")) throw new Error("Missing MIT license in package");
  await readFile(path.join(consumer, "node_modules/opencode-auto-reasoning", installed.exports["./tui"]));
  const classifierTypesOnly = await readFile(path.join(consumer, "node_modules/opencode-auto-reasoning/dist/classifier.js"), "utf8");
  if (classifierTypesOnly.includes("localClassifier")) throw new Error("Local classifier leaked into distribution");
  const script = `
    import assert from 'node:assert/strict';
    import plugin from 'opencode-auto-reasoning';
    import { AutoReasoning } from 'opencode-auto-reasoning/rpc';
    let callback; let promptCallback; let status; let disposed = 0; let modelCalls = 0;
    const registration = { dispose: async () => { disposed++; } };
    const ctx = {
      options: {},
      session: { hook: async (name, fn) => { if (name === 'context') callback = fn; else { assert.equal(name, 'prompt'); promptCallback = fn; } return registration; } },
      model: { list: async () => ({ data: [{ providerID: 'openai', id: 'smoke', variants: [
        { id: 'low', settings: { reasoningEffort: 'low' } }, { id: 'high', settings: { reasoningEffort: 'high' } }
       ], settings: { reasoningEffort: 'high' } }, { providerID: 'openai', id: 'gpt-6-luna', modelID: 'gpt-6-luna', enabled: true,
        status: 'active', variants: [{ id: 'low' }] }] }) },
      tool: { transform: async editor => { editor({ add() {} }); return registration; } },
      rpc: { register: async (definition, handlers) => { assert.equal(definition.id, AutoReasoning.id); status = handlers.status; return registration; } },
      event: { async *subscribe() {} },
      experimental: { generate: { text: async ({ model }) => {
        modelCalls++; assert.equal(model.id, 'gpt-6-luna'); assert.equal(model.variant, 'low');
        return { text: JSON.stringify({ difficulty: 'High', reasons: ['algorithm-or-concurrency'] }) };
      } } },
    };
    assert.equal(plugin.id, 'auto-reasoning');
    const cleanup = await plugin.setup(ctx);
    assert.equal(typeof cleanup, 'function');
    const event = { sessionID: 'ses_smoke', agent: 'build', model: { providerID: 'openai', id: 'smoke', variant: 'default' },
      options: {}, system: [], tools: {}, messages: [{ id: 'msg_smoke', role: 'user', content: [{ type: 'text', text: 'README.mdの誤字を修正' }] }] };
    await callback(event);
    assert.deepEqual(event.options, {});
    assert.equal(modelCalls, 0); // Explicit permission is still required by default.
    const snapshot = await status({ sessionID: 'ses_smoke' });
    assert.equal(snapshot.status.reason, 'original-prompt-unavailable');
    assert.equal(snapshot.metrics.classifications, 0);
    await cleanup(); assert.equal(disposed, 4);
    ctx.options = { engine: 'model', allowModelRequests: true };
    const cleanupModel = await plugin.setup(ctx);
    event.options = {};
    promptCallback({ sessionID: event.sessionID, messageID: event.messages[0].id,
      prompt: { text: 'Implement a complex algorithm' }, delivery: 'steer' });
    await callback(event);
    assert.equal(modelCalls, 1);
    assert.equal(event.model.id, 'smoke');
    const modelStatus = await status({ sessionID: 'ses_smoke' });
    assert.equal(modelStatus.status.reason, 'model-assessment');
    assert.equal(modelStatus.metrics.additionalTokens, null);
    await cleanupModel(); assert.equal(disposed, 8);
    ctx.options = { allowModelRequests: true };
    ctx.model.list = async () => ({ data: [
      { providerID: 'anthropic', id: 'smoke', settings: { effort: 'low' }, variants: [
        { id: 'high', settings: { effort: 'high' } }
      ] },
      { providerID: 'openai', id: 'gpt-6-luna', modelID: 'gpt-6-luna', enabled: true, variants: [{ id: 'low' }] }
    ] });
    ctx.experimental.generate.text = async ({ model }) => {
      modelCalls++; assert.equal(model.providerID, 'openai'); assert.equal(model.id, 'gpt-6-luna');
      return { text: JSON.stringify({ difficulty: 'High', reasons: ['algorithm-or-concurrency'] }) };
    };
    const cleanupClaude = await plugin.setup(ctx);
    event.model = { providerID: 'anthropic', id: 'smoke' }; event.options = {};
    promptCallback({ sessionID: event.sessionID, messageID: event.messages[0].id,
      prompt: { text: 'Implement a complex algorithm' }, delivery: 'steer' });
    await callback(event);
    assert.deepEqual(event.options, {}); assert.equal(modelCalls, 1);
    assert.equal((await status({ sessionID: event.sessionID })).status.reason, 'unsupported-provider');
    await cleanupClaude(); assert.equal(disposed, 12);
    ctx.options = { classifierModel: 'anthropic/claude-haiku-5-5', allowModelRequests: true };
    assert.equal(await plugin.setup(ctx), undefined); assert.equal(modelCalls, 1);
    console.log('Installed package: Luna classification, OpenAI-only context/status RPC and cleanup OK');
  `;
  run(["--input-type=module", "-e", script], consumer);
  console.log(JSON.stringify({ package: installed.name, version: installed.version,
    installedPackage: "passed", network: "offline", lifecycleScripts: "disabled",
    tuiEntrypoint: installed.exports["./tui"],
    note: "Server callbacks use a mock host. Native TUI rendering and live model dispatch are not tested." }, null, 2));
} finally {
  // Only the unique directory created above is removed, never the project or user paths.
  await rm(temporary, { recursive: true, force: true, maxRetries: 3 });
}
