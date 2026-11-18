# v0.2.1 — 全32系列のモデル別思考量選択（Preview）

OpenCode V2向けの自動思考量調整プラグインの試用版です。GPT-6 Lunaが課題の難易度を判定し、ユーザーが選んだOpenAI開発モデルに応じて思考量を選びます。開発モデル自体は変更しません。npmレジストリは未公開です。公開済みv0.2.0のタグ・添付ファイルは変更しません。

## 変更点

- 2026-11-18時点のOpenAIカタログ98項目を確認し、reasoning effortを持つ**32のAPI `modelID`**すべてにモデル別ポリシーを追加しました。
- 根拠を4つに区別します。複数ベンチマークで再検討した14系列（09 r2の9系列と18 r2の5系列）、思考量別sweepを1つだけ確認した7系列（18 r1）、同条件のsweepがない11系列（ヒューリスティック）。状態の`policy`欄で確認できます。
- 新たに5系列を`benchmark-2026-11-18-r2`へ昇格しました。AA Terminal-Bench 4.0とFrontierCode-AA 2.0の両方で最上位のmaxがxhighを上回った**GPT-6.2 SolのVery Highのみ**xhigh→maxへ変更し、他4系列はプロファイルを維持しました。
- Fast／Flex／Pro／UltrafastはカタログAPIの`modelID`が同じ場合に同じ表を適用します。`gpt-5.6`を`gpt-5.6-sol`へ、Daybreakを別モデルへ読み替えるような名前推測は行いません。
- Lunaの判定prompt・JSON検証・送信許可の仕組みは変更していません。[精度測定](ACCURACY.md)の44/48（91.7%）、反復一致22/24（91.7%）を引き継ぎます。これは作者ラベルの48件によるラベル精度であり、下流の品質や節約効果ではありません。

### 2026-11-18に再検討した5系列

| モデル | Very Low → Low → High → Very High |
|---|---|
| 6.2 Sol | low → medium → high → **max** |
| 6.2 Astra | low → medium → high → xhigh |
| 5.4 | low → low → medium → xhigh |
| 5.4 mini | low → medium → high → xhigh |
| 5.2 | low → medium → high → high |

Artificial Analysisの2課題群、LiveBench、OckBench、Cognition FrontierCodeを比較した**暫定設計**です。点数の平均や多数決は行っていません。Single-pointの結果（5.4のDeepSWE xhigh、5 miniのOckBench-Math high）は2つ目のsweepとして数えていません。残る7系列は単一sweepの曲線をanchorにした暫定ポリシー、11系列は未測定の能力クラス判定です。いずれも公式推奨や4難易度別の最適値を意味しません。根拠・反証は[複数ベンチマークの比較](MULTI-BENCHMARK-REVIEW.md#2026-11-18の追加レビュー新規5系列)、全表は[モデル別思考量ポリシー](MODEL-POLICIES.md)を参照してください。

## 更新時の注意

既定の`maxEffort`はv0.2.0から`max`のままです。待ち時間や利用枠の消費が増える可能性があります。単一sweep7系列とヒューリスティック11系列は`max`を自動選択しません（18 r2の6.2 SolはVery Highで`max`）。従来の共通表と上限を使う場合は、既存の`options`へ次を設定します。設定全体を置き換えないでください。

```jsonc
"modelPolicy": "common",
"maxEffort": "xhigh"
```

明示してある旧`maxEffort: "xhigh"`は引き続き尊重します。`none`は自動選択しませんが、明示variantや既存request overrideは保持します。外部判定は既定で無効、`allowModelRequests: true`による許可が必要です。

## 検証・制限

- 146件のテスト、型検査、ビルド、保持上限benchmark、実tarballのオフラインインストール検証、配布物パックが成功。
- 32系列×4難易度、主要なFast／Flex／Pro／Ultrafast別名、カタログ上限によるクランプをモックで検証。
- この版で追加の実モデル呼び出しは行っていません。Lunaの精度測定は2026-11-08のもので、新規5系列の個別表・maxの実HTTP送信・実利用の品質と節約効果は未検証です。
- 過去の実OpenCode 2.2.6によるlow/xhigh送信確認はv0.1.0の共通表での確認です。
- Desktop・native TUI描画・WebSocket・長時間のツール継続は実機未検証。Desktop専用状態表示は未実装。
- 対象はNode.js 22以上、OpenCode V2、SDK 2.2.6。V1非対応。開発用の調整対象は`openai`プロバイダだけです。
- SDK推移依存の監査警告は継続。公開前の`npm audit --omit=dev`はmoderate 23件、high 5件、criticalなし。その時点のスナップショットであり、安全性を保証するものではありません。

## インストール・更新

添付`.tgz`と`SHA256SUMS`をダウンロードし、SHA-256を照合します。

```powershell
Get-FileHash ./opencode-auto-reasoning-0.2.1.tgz -Algorithm SHA256
npm install --prefix ./auto-reasoning-plugin ./opencode-auto-reasoning-0.2.1.tgz --ignore-scripts
```

OpenCodeの既存`plugins`には、インストール先の`auto-reasoning-plugin/node_modules/opencode-auto-reasoning`の絶対パスを指定します。既存の設定・送信許可を維持し、今回新たに許可を有効化する場合は利用権・送信先・料金を確認してください。MIT License。
