import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { defaults, parseConfig } from "../src/config.js";

test("classification is Luna-only with a 15-second deadline and explicit request permission", () => {
  assert.equal(defaults.engine, "model");
  assert.equal(defaults.classifierModel, "openai/gpt-6-luna#low");
  assert.equal(defaults.timeoutMs, 15_000);
  assert.equal(defaults.allowModelRequests, false);
  assert.equal(parseConfig({ classifierModel: "opencode/gpt-6-luna#low" }).classifierModel, "opencode/gpt-6-luna#low");
  for (const classifierModel of ["anthropic/claude-haiku-5-5", "opencode/claude-haiku-5-5", "google/gemma-4-31b-it#none"]) {
    assert.throws(() => parseConfig({ classifierModel }));
  }
});
test("GitHub workflows never run paid evaluation and only prepare draft releases", async () => {
  const ci = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  const release = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  for (const workflow of [ci, release]) {
    assert.doesNotMatch(workflow, /evaluate:live|OPENAI_API_KEY|npm publish/);
    const actions = [...workflow.matchAll(/uses: actions\/[^@]+@([^\s]+)/g)];
    assert.ok(actions.length > 0);
    for (const action of actions) assert.match(action[1]!, /^[a-f0-9]{40}$/);
  }
  assert.match(release, /--draft/);
  assert.match(release, /needs: checks/);
});
test("public repository metadata and MIT license are included", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const license = await readFile(new URL("../LICENSE", import.meta.url), "utf8");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.repository.url, "git+https://github.com/MametaroGG/OpenCodeCLI-Codex-AutoReasoning.git");
  assert.match(license, /^MIT License/);
  assert.match(license, /Copyright \(c\) 2026 MametaroGG/);
});
