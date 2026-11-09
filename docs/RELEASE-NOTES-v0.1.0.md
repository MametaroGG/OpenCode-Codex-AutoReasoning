# v0.1.0 — 初回試用版

OpenCode V2向けのLuna専用・OpenAI向け自動思考量調整プラグインです。**Pre-releaseであり、まだ日常開発での品質・節約効果を確認する段階です。** npmレジストリには公開していません。

## できること

- ユーザーの指示をGPT-6 Lunaで4段階に分類し、開発用OpenAIモデルの対応するreasoning effortを選択。
- 開発用モデルは変更せず、明示variant・既存request overrideを優先。
- 外部送信は既定で無効。失敗・タイムアウト時は元設定を保持。
- キャッシュ、手動指定、入力最小化、回数上限、読み取り専用`/reasoning-status`。

## 検証

- 74件の単体テスト、型検査、ビルド、オフライン配布パッケージ検証。
- 実OpenCode 2.2.6＋GPT-6.1 Solで、誤字修正→low／複雑な設計→xhighをHTTP送信本文まで確認し、両方HTTP 200。
- この実試験で発見した、variant未指定時の`default`誤認を修正。
- Lunaの初回24課題×2回の合成評価は期待ラベルと44/48一致。一般的な精度や実装品質・節約効果を保証する値ではありません。

## 制限・注意点

- 開発側は`openai`プロバイダのみ。判定役はGPT-6 Luna（openai/opencode）専用。
- OpenCode V1には非対応。Node.js 22以上、SDK 2.2.6を対象。
- native TUI描画・WebSocket・長時間のツール継続は実機未検証。
- 判定には利用枠または料金を消費します。正確なLuna使用量・請求額は取得できず不明です。
- SDKの推移依存に既知のmoderate監査警告があります（記録時24件、high/criticalなし）。安全性を保証するものではありません。
- 機密情報の完全な除去は保証しません。機密作業では外部判定を無効にしてください。

## インストール

添付の`.tgz`と`SHA256SUMS`をダウンロードし、SHA-256を照合します。

```powershell
Get-FileHash ./opencode-auto-reasoning-0.1.0.tgz -Algorithm SHA256
npm install --prefix ./auto-reasoning-plugin ./opencode-auto-reasoning-0.1.0.tgz --ignore-scripts
```

既存の`opencode.jsonc`の`plugins`に、インストールした`auto-reasoning-plugin/node_modules/opencode-auto-reasoning`の絶対パスを追加します。既存設定を置き換えないでください。`allowModelRequests`は利用権・送信先・料金を確認してから明示的に有効化します。

詳しくはREADMEの導入手順、docs/VALIDATION.md、docs/LIVE-HOST-VALIDATION.mdを参照してください。MIT License。
