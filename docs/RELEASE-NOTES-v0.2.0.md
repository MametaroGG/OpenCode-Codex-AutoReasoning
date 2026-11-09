# v0.2.0 — モデル別思考量選択（Preview）

OpenCode V2向けの自動思考量調整プラグインの試用版です。GPT-6 Lunaが課題の難易度を判定し、ユーザーが選んだOpenAI開発モデルに応じて思考量を選びます。開発モデル自体は変更しません。npmレジストリは未公開です。

## 変更点

- 全9系列に個別ポリシーを適用。Fast版はカタログのAPI modelIDが同じ場合に同じ表を使用。
- `max`対応。対応思考量は実際のカタログで確認し、設定のmin/maxも適用。
- 状態表示に適用ポリシーと、制約適用前の推奨値を追加。
- 明示variant・既存request override・手動指定の優先順位、OpenAI限定、失敗時の設定保持は維持。
- リポジトリURLをOpenCode-Codex-AutoReasoningへ更新。v0.1.0のタグ・添付ファイルは変更しません。

### モデル別ポリシーr2

| モデル | Very Low → Low → High → Very High |
|---|---|
| 6.1 Sol | low → medium → high → xhigh |
| 6.1 Terra | low → high → xhigh → max |
| 6 Astra | low → low → medium → xhigh |
| 6 Sol | low → medium → xhigh → max |
| 6 Luna | low → high → xhigh → max |
| 5.6 Sol | low → medium → xhigh → max |
| 5.6 Terra | low → high → xhigh → max |
| 5.6 Luna | low → high → xhigh → max |
| 5.5 | low → high → xhigh → xhigh |

VulcanBench、Datacurve DeepSWE、Artificial Analysisの開発評価、Hex DataBench等を比較した**暫定設計**です。公式がこの4段階の割当を推奨しているわけではなく、最適値や品質・節約の改善を本プラグインで実証したものでもありません。未知モデル・API ID不明は従来の共通表へ戻します。

## 更新時の注意

**既定の`maxEffort`を`xhigh`から`max`へ変更しました。** 最難課題等で待ち時間や利用枠の消費が増える可能性があります。特に6 Lunaは、VulcanBenchでmaxのタイムアウト増加が観測されています。

従来の表と上限を保つ場合は、既存の`plugins[].options`へ次の2項目を設定してください。設定全体は置き換えないでください。

```jsonc
"modelPolicy": "common",
"maxEffort": "xhigh"
```

明示してある旧`maxEffort: "xhigh"`は引き続き尊重します。`none`は自動選択しませんが、明示variantや既存request overrideは保持します。外部判定は既定で無効、`allowModelRequests: true`による許可が必要です。

## 検証・制限

- 98件のオフラインテスト、型検査、ビルド、保持上限benchmark、実tarballのオフラインインストール検証が成功。
- 全9系列×通常／Fast×4難易度の72組合せをモックのcontext hookで検証。
- この版で追加の実モデル呼び出しは行っていません。新しい個別表・maxの実HTTP送信・実利用の成果物品質は未検証です。
- 過去の実OpenCode 2.2.6によるlow/xhigh送信確認はv0.1.0の共通表での確認です。
- Desktop・native TUI描画・WebSocket・長時間のツール継続は実機未検証。Desktop専用状態表示は未実装。
- 対象はNode.js 22以上、OpenCode V2、SDK 2.2.6。V1非対応。開発用の調整対象は`openai`プロバイダだけです。
- SDK推移依存の既知の監査警告は継続。公開前のnpm auditはmoderate 24件、high/criticalなし。機密情報の完全除去や料金上限は保証しません。

根拠・反証はdocs/MULTI-BENCHMARK-REVIEW.md、対応表はdocs/MODEL-POLICIES.md、オフライン検証はdocs/MODEL-POLICY-VALIDATION.mdを参照してください。

## インストール・更新

添付`.tgz`と`SHA256SUMS`をダウンロードし、SHA-256を照合します。

```powershell
Get-FileHash ./opencode-auto-reasoning-0.2.0.tgz -Algorithm SHA256
npm install --prefix ./auto-reasoning-plugin ./opencode-auto-reasoning-0.2.0.tgz --ignore-scripts
```

OpenCodeの既存`plugins`には、インストール先の`auto-reasoning-plugin/node_modules/opencode-auto-reasoning`の絶対パスを指定します。既存の設定・送信許可を維持し、今回新たに許可を有効化する場合は利用権・送信先・料金を確認してください。MIT License。
