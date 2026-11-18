# v0.2.2 — npm公開準備（Preview）

> [!NOTE]
> この版ではパッケージ名を`opencode-auto-reasoning`としており、**プラグイン本体はnpmに公開されていません**。正式名は`opencode-codex-reasoning`で、npm公開は[v0.2.3](RELEASE-NOTES-v0.2.3.md)で行っています。以下のnpmインストール例は当時の誤った手順として残しています。

OpenCode V2向けの自動思考量調整プラグインの試用版です。GPT-6 Lunaが課題の難易度を判定し、ユーザーが選んだOpenAI開発モデルに応じて思考量を選びます。開発モデル自体は変更しません。npm公開は行われていません（上の注記を参照）。

## v0.2.1からの変更

- `package.json`の`private`を解除し、`publishConfig.access: "public"`を追加。ライセンスはMIT。
- READMEとリリースノートへnpmからのインストール手順を追加。GitHub Releasesの`.tgz`と`SHA256SUMS`も引き続き配布します。
- Lunaの精度に関する記述を明確化。2026-11-08の実測44/48（91.7%）は判定promptとJSON検証が測定時と同一であることを根拠に参照していますが、判定実装のSHA-256は測定時（`bf09be1d…`）と現在（`6812841e…`）で異なります。差は既定タイムアウト3秒→15秒の変更によるもので、**同一コードの再測定ではありません**。追加の実モデル呼び出しは行っていません。
- 公開済みのv0.1.0／v0.2.0／v0.2.1のタグ・添付ファイルは変更しません。

v0.2.1の機能内容（reasoning effort対応32系列、09 r2の9系列・18 r2の5系列・18 r1の7系列・ヒューリスティック11系列）は変わりません。詳細は[v0.2.1のリリースノート](RELEASE-NOTES-v0.2.1.md)を参照してください。

## インストール

npmレジストリから:

```powershell
npm install --prefix ./auto-reasoning-plugin opencode-auto-reasoning@0.2.2 --ignore-scripts
```

GitHub Releasesから（`.tgz`と`SHA256SUMS`をダウンロードしてSHA-256を照合）:

```powershell
Get-FileHash ./opencode-auto-reasoning-0.2.2.tgz -Algorithm SHA256
npm install --prefix ./auto-reasoning-plugin ./opencode-auto-reasoning-0.2.2.tgz --ignore-scripts
```

OpenCodeの既存`plugins`には、インストール先の`auto-reasoning-plugin/node_modules/opencode-auto-reasoning`の絶対パスを指定します。既定では外部判定は無効で、`allowModelRequests: true`による明示的な許可が必要です。

## 検証・制限

- 146件のテスト、型検査、ビルド、保持上限benchmark、実tarballのオフラインインストール検証、GitHub配布物のパック、npm公開のdry-runが成功。
- 32系列×4難易度、主要なFast／Flex／Pro／Ultrafast別名、カタログ上限によるクランプをモックで検証。
- 実モデル呼び出しはこの版でも行っていません。Lunaの精度は24種類×2回の作者ラベルによる補助的な指標であり、下流の品質・節約効果や本番の判定精度を保証しません。
- Desktop・native TUI描画・WebSocket・長時間のツール継続は実機未検証。対象はNode.js 22以上、OpenCode V2、SDK 2.2.6で、開発用の調整対象は`openai`プロバイダだけです。
- SDK推移依存の監査警告は継続。公開前の`npm audit --omit=dev`はmoderate 23件、high 5件、criticalなし。

全系列の対応表は[モデル別思考量ポリシー](MODEL-POLICIES.md)、根拠は[複数ベンチマークの比較](MULTI-BENCHMARK-REVIEW.md)、精度測定は[ACCURACY.md](ACCURACY.md)を参照してください。
