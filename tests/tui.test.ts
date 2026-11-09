import { test } from "node:test";
import assert from "node:assert/strict";
import type { Context, Route } from "@opencode/plugin/tui/context";
import { formatStatus, setupTui } from "../src/tui-setup.js";

function harness() {
  let run: (() => Promise<void>) | undefined;
  let route: Route = { type: "session", sessionID: "ses_test" };
  let calls = 0;
  let fail = false;
  let wait: Promise<void> | undefined;
  let signal: AbortSignal | undefined;
  const alerts: string[] = [];
  const toasts: string[] = [];
  const ctx = {
    keymap: { layer(factory: () => { commands: { id: string; slash: { name: string }; run: () => Promise<void> }[] }) {
      const command = factory().commands[0]!;
      assert.equal(command.id, "auto-reasoning.status");
      assert.equal(command.slash.name, "reasoning-status");
      run = command.run;
    } },
    client: { rpc() { return { status: async (input: { sessionID: string }, options: { signal: AbortSignal; location: { directory: string } }) => {
      calls++; signal = options.signal;
      assert.equal(input.sessionID, "ses_test");
      assert.equal(options.location.directory, "test-location");
      if (wait) await wait;
      if (fail) throw new Error("must-not-show-sensitive-error");
      return { status: { effort: "xhigh", reason: "local-assessment", difficulty: "Very High", cacheHit: true, durationMs: 0.123 }, metrics: {} };
    } }; } },
    data: { location: { default() { return { directory: "test-location" }; } } },
    ui: { router: { current() { return route; } },
      dialog: { async alert(input: { message: string }) { alerts.push(input.message); } },
      toast: { show(input: { message: string }) { toasts.push(input.message); } } },
  } as unknown as Context;
  const cleanup = setupTui(ctx);
  return { run: () => run!(), cleanup, alerts, toasts,
    get calls() { return calls; }, get signal() { return signal; },
    route(value: Route) { route = value; }, fail() { fail = true; }, wait(value: Promise<void>) { wait = value; } };
}
test("status slash command uses RPC, displays selection and does not submit a prompt", async () => {
  const h = harness(); await h.run();
  assert.equal(h.calls, 1); assert.equal(h.alerts.length, 1);
  assert.match(h.alerts[0]!, /xhigh/); assert.match(h.alerts[0]!, /0.123ms/);
  h.cleanup(); assert.equal(h.signal?.aborted, true);
});
test("home command gives guidance without an RPC call", async () => {
  const h = harness(); h.route({ type: "home" }); await h.run();
  assert.equal(h.calls, 0); assert.equal(h.toasts.length, 1); h.cleanup();
});
test("RPC errors are generic and do not leak exception messages", async () => {
  const h = harness(); h.fail(); await h.run();
  assert.equal(h.alerts.length, 0); assert.equal(h.toasts.length, 1);
  assert.doesNotMatch(h.toasts[0]!, /sensitive/); h.cleanup();
});
test("duplicate clicks coalesce and navigation suppresses stale dialogs", async () => {
  const h = harness(); let release!: () => void;
  h.wait(new Promise(resolve => { release = resolve; }));
  const first = h.run(); await h.run(); assert.equal(h.calls, 1);
  h.route({ type: "session", sessionID: "ses_other" }); release(); await first;
  assert.equal(h.alerts.length, 0); h.cleanup();
});
test("unload suppresses responses from outstanding RPCs", async () => {
  const h = harness(); let release!: () => void;
  h.wait(new Promise(resolve => { release = resolve; }));
  const first = h.run(); h.cleanup(); release(); await first; await h.run();
  assert.equal(h.alerts.length, 0); assert.equal(h.calls, 1);
});
test("formatter handles unassessed/malformed status", () => {
  assert.match(formatStatus({ status: { reason: "not-assessed" } }), /未判定/);
  assert.match(formatStatus(null), /取得できません/);
  assert.match(formatStatus({ status: { reason: "model-assessment", classifierModel: "openai/gpt-6-luna#low" },
    metrics: { additionalTokens: null } }), /不明（SDKから未提供/);
});
