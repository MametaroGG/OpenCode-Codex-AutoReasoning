import type { Context } from "@opencode/plugin/tui/context";
import { AutoReasoning } from "./rpc.js";

export function formatStatus(value: unknown): string {
  if (!value || typeof value !== "object") return "状態を取得できませんでした。";
  const snapshot = value as Record<string, unknown>;
  if (!snapshot.status || typeof snapshot.status !== "object") return "状態を取得できませんでした。";
  const status = snapshot.status as Record<string, unknown>;
  const lines = [
    `選択した思考量: ${typeof status.effort === "string" ? status.effort : "変更なし／未判定"}`,
    `理由: ${typeof status.reason === "string" ? status.reason : "不明"}`,
  ];
  if (typeof status.difficulty === "string") lines.push(`難易度: ${status.difficulty}`);
  if (typeof status.policy === "string") lines.push(`選択方針: ${status.policy}`);
  if (typeof status.requestedEffort === "string") lines.push(`上限・対応範囲適用前: ${status.requestedEffort}`);
  if (typeof status.classifierModel === "string") lines.push(`判定用モデル: ${status.classifierModel}`);
  if (Array.isArray(status.reasons)) lines.push(`判定根拠: ${status.reasons.filter(r => typeof r === "string").join(", ")}`);
  if (typeof status.cacheHit === "boolean") lines.push(`キャッシュ: ${status.cacheHit ? "命中" : "新規判定"}`);
  if (typeof status.durationMs === "number") lines.push(`判定時間: ${status.durationMs.toFixed(3)}ms`);
  if (snapshot.metrics && typeof snapshot.metrics === "object" &&
      (snapshot.metrics as Record<string, unknown>).additionalTokens === null) {
    lines.push("判定トークン使用量: 不明（SDKから未提供。0ではありません）");
  }
  lines.push("\nこの表示は履歴・モデル設定・判定値を変更しません。最終送信値を保証するものではありません。");
  return lines.join("\n");
}

export function setupTui(ctx: Context) {
  let active = true;
  let pending = false;
  const requests = new AbortController();
  ctx.keymap.layer(() => ({
    mode: "global",
    commands: [{
      id: "auto-reasoning.status", title: "Auto Reasoning: 状態を表示", group: "Auto Reasoning",
      palette: true, slash: { name: "reasoning-status" },
      run: async () => {
        if (!active || pending) return;
        const route = ctx.ui.router.current();
        if (route.type !== "session") {
          ctx.ui.toast.show({ message: "セッションを開いてから実行してください。", variant: "info" });
          return;
        }
        pending = true;
        try {
          // Read client and location at invocation time so reloads do not use a stale client.
          const snapshot = await ctx.client.rpc(AutoReasoning).status({ sessionID: route.sessionID }, {
            location: ctx.location ?? ctx.data.location.default(),
            signal: requests.signal,
          });
          const current = ctx.ui.router.current();
          if (active && current.type === "session" && current.sessionID === route.sessionID) {
            await ctx.ui.dialog.alert({ title: "Auto Reasoning", message: formatStatus(snapshot) });
          }
        } catch {
          if (active) ctx.ui.toast.show({ message: "Auto Reasoningの状態を取得できませんでした。サーバー側の読み込みを確認してください。", variant: "error" });
        } finally { pending = false; }
      },
    }],
  }));
  return () => { active = false; requests.abort(); };
}
