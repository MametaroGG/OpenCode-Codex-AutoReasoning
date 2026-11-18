# v0.2.5 — SDK 2.3.2対応

OpenCode V2向けの自動思考量調整プラグインです。GPT-6 Lunaが課題の難易度を判定し、ユーザーが選んだOpenAI開発モデルに応じて思考量を選びます。開発モデル自体は変更しません。npmレジストリでは`opencode-codex-autoreasoning`、GitHub Packagesでは`@mametarogg/opencode-codex-autoreasoning`として公開しています。

## v0.2.4からの変更

- `@opencode/plugin`を2.2.6から2.3.2へ更新。型検査・146件のテスト・ビルド・オフラインの配布検証が新しいSDKで成功しました。実機HTTP送信の確認は2.2.6で行ったもので、2.3.2での実機送信は未検証です。
- READMEの日本語版・英語版から開発時点の記述を整理。バージョン固定の推奨、`v0.2.0以降`のような履歴、旧Pre-releaseの注記、バージョンに依存する説明を削除しました。
- READMEの英語版`README.en.md`を追加し、日本語版と相互リンク。npm配布物にも含まれます。
- モデル別ポリシー、Lunaの判定prompt、テスト146件の結果は変更なしです。

モデル別ポリシーの詳細は[v0.2.4のリリースノート](RELEASE-NOTES-v0.2.4.md)を参照してください。

## インストール

バージョン指定を省くとnpmの`latest`を入ります。再現性が必要な場合のみバージョンを固定してください。

npmレジストリから:

```powershell
npm install --prefix ./auto-reasoning-plugin opencode-codex-autoreasoning --ignore-scripts
```

GitHub Packagesから（`read:packages`権限の認証が必要）:

```powershell
npm config set @mametarogg:registry https://npm.pkg.github.com
npm i @mametarogg/opencode-codex-autoreasoning --ignore-scripts
```

OpenCodeの`plugins[].package`には、インストール先の`node_modules/opencode-codex-autoreasoning`（GitHub Packagesの場合は`node_modules/@mametarogg/opencode-codex-autoreasoning`）の絶対パスを指定します。外部判定は既定で無効で、`allowModelRequests: true`による明示的な許可が必要です。

## 検証・制限

- SDK 2.3.2で型検査・146件のテスト・ビルド・保持上限benchmark・実tarballのオフラインインストール検証が成功。
- 32系列×4難易度、主要なFast／Flex／Pro／Ultrafast別名、カタログ上限によるクランプをモックで検証。
- 実機HTTP送信・Desktop/native TUI/WebSocket・実利用での品質と節約効果は未検証です。Lunaの精度は24種類×2回の作者ラベルによる補助的な指標であり、下流の品質・節約効果を保証しません。
- 対象はNode.js 22以上、OpenCode V2、SDK 2.3.2系。V1非対応。開発用の調整対象は`openai`プロバイダだけです。
- SDK推移依存の監査警告は継続。公開前の`npm audit --omit=dev`はmoderate 23件、high 5件、criticalなし。

詳細は[モデル別思考量ポリシー](MODEL-POLICIES.md)、[複数ベンチマークの比較](MULTI-BENCHMARK-REVIEW.md)、[分類精度](ACCURACY.md)を参照してください。
