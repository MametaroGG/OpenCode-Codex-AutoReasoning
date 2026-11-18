# v0.2.4 — npm公開（Preview）

OpenCode V2向けの自動思考量調整プラグインの試用版です。GPT-6 Lunaが課題の難易度を判定し、ユーザーが選んだOpenAI開発モデルに応じて思考量を選びます。開発モデル自体は変更しません。**npmレジストリでは `opencode-codex-autoreasoning@0.2.4` として公開します。**

## v0.2.3からの変更

- npmパッケージ名を最終名の`opencode-codex-autoreasoning`へ変更。0.2.2の`opencode-auto-reasoning`と0.2.3の`opencode-codex-reasoning`はいずれも誤りで、プラグイン本体はnpmに公開されていませんでした（前者には`0.0.0-stage`プレースホルダーだけが存在します）。公開済みの0.2.2／0.2.3のタグ・GitHub Releaseは変更していません。
- `package.json`・lockfile・README・リリースノート・配布検証スクリプトの名前とインストール手順を更新。GitHub Releasesのtgz名も`opencode-codex-autoreasoning-0.2.4.tgz`です。
- v0.2.3の機能内容（reasoning effort対応32系列、09 r2の9系列・18 r2の5系列・18 r1の7系列・ヒューリスティック11系列）とLunaの精度に関する記述は変更なし。詳細は[v0.2.3のリリースノート](RELEASE-NOTES-v0.2.3.md)を参照してください。

## インストール

npmレジストリから:

```powershell
npm install --prefix ./auto-reasoning-plugin opencode-codex-autoreasoning@0.2.4 --ignore-scripts
```

GitHub Releasesから（`.tgz`と`SHA256SUMS`をダウンロードしてSHA-256を照合）:

```powershell
Get-FileHash ./opencode-codex-autoreasoning-0.2.4.tgz -Algorithm SHA256
npm install --prefix ./auto-reasoning-plugin ./opencode-codex-autoreasoning-0.2.4.tgz --ignore-scripts
```

OpenCodeの既存`plugins`には、インストール先の`auto-reasoning-plugin/node_modules/opencode-codex-autoreasoning`の絶対パスを指定します。既定では外部判定は無効で、`allowModelRequests: true`による明示的な許可が必要です。

## 検証・制限

- 146件のテスト、型検査、ビルド、保持上限benchmark、実tarballのオフラインインストール検証、GitHub配布物のパック、npm公開のdry-runが成功。
- 32系列×4難易度、主要なFast／Flex／Pro／Ultrafast別名、カタログ上限によるクランプをモックで検証。
- 実モデル呼び出しはこの版でも行っていません。Lunaの精度は24種類×2回の作者ラベルによる補助的な指標であり、下流の品質・節約効果や本番の判定精度を保証しません。判定promptとJSON検証は測定時と同一ですが、判定実装ハッシュは異なります（既定タイムアウト3秒→15秒）。
- Desktop・native TUI描画・WebSocket・長時間のツール継続は実機未検証。対象はNode.js 22以上、OpenCode V2、SDK 2.2.6で、開発用の調整対象は`openai`プロバイダだけです。
- SDK推移依存の監査警告は継続。公開前の`npm audit --omit=dev`はmoderate 23件・high 5件・criticalなし。

全系列の対応表は[モデル別思考量ポリシー](MODEL-POLICIES.md)、根拠は[複数ベンチマークの比較](MULTI-BENCHMARK-REVIEW.md)、精度測定は[ACCURACY.md](ACCURACY.md)を参照してください。
