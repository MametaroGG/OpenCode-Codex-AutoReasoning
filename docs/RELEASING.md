# バージョン管理とGitHub Releases

このフォルダが独立したリポジトリのルートです。親フォルダや他プロジェクトは含めません。公開先は [MametaroGG/OpenCode-Codex-AutoReasoning](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning)、ライセンスは [MIT](../LICENSE) です。パッケージ名・plugin IDは互換性のため維持しています。GitHubのPre-releaseとして試用版を配布し、v0.2.2からnpmレジストリにも公開しています。公開済みv0.1.0のtag・添付ファイルは上書きせず、モデル別ポリシーとメタデータの新URLはv0.2.0から反映します。最新のv0.2.2は、新規対応モデルを含む全32系列のポリシーに加えてnpm公開を含む試用版です。公開済みv0.2.0のtag・添付ファイルも変更しません。

## 公開前の確認

- 公開先は `MametaroGG/OpenCode-Codex-AutoReasoning`（公開）。Releaseに添付するコードのライセンスがMITであることを確認する。
- 実OpenCode 2.2.6の本体ロード・prompt ID・Solへのlow/xhigh HTTP送信・RPCは確認済み。[実ホスト検証](LIVE-HOST-VALIDATION.md)参照。native TUI描画とWebSocketは未確認であり、公開前に確認または制限を明記する。開発用の調整対象は`openai`のみです。
- SDKの推移依存にmoderateの監査警告があることを確認する。未解決のまま出す場合は、リリースノートにも明記する。
- 認証情報、実行ログ、不要な成果物をコミットしない。`evaluation-results/`の生ログは合成データでもローカルパス・セッションIDを含むため、ローカルに保持しGitと配布物から除外する。検証の要約・合成fixtureは公開する。

## ソースの取得

```powershell
git clone https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning.git
cd OpenCode-Codex-AutoReasoning
git status --short
```

ステージング対象を確認してから追加・commitします。GitHub認証はCLI等で管理し、トークンをファイルへ書かないでください。

## バージョン更新と配布物

```powershell
# 例: 次のパッチ版へ更新。package.jsonとlockfileを更新し、自動tag/commitはしない。
npm version patch --no-git-tag-version
npm ci
npm run typecheck
npm test
npm run benchmark
npm run verify:package
npm run release:pack
```

`CHANGELOG.md`を更新し、変更をcommitします。初回版はpackage.jsonにある0.1.0を利用可能です。`release/` に以下を生成します。

- `opencode-auto-reasoning-<version>.tgz`: dist、ドキュメント、設定例、package.json。
- `SHA256SUMS`: 配布ファイルのSHA-256。

node_modules、比較用の旧ローカル判定、実行ログ、実モデル評価の台帳は含めません。依存ライブラリは同梱しないのでインストール時にnpmが取得します。v0.2.2以降は`private`を解除し、`publishConfig.access: "public"`でnpmレジストリへ公開します。npmのバージョンは一度公開すると上書き・削除できないため、`npm publish --dry-run`で添付物を確認してから実行し、修正は新しいバージョンで行います。

## npmへの公開

```powershell
npm publish --dry-run
npm publish --access public
npm view opencode-auto-reasoning version dist.tarball
```

名前の空き・公開権限・2FA・`files`の範囲を事前に確認します。2FAが有効な場合は対話ターミナルでワンタイムコードを入力する必要があるため、非対話シェルでは公開できないことがあります。GitHub Releaseのtgzとnpmのtarballは同じバージョン・同じ`package.json`・同じ`dist`から生成しますが、npmは`private`解除後のメタデータを含むため、バイト単位では一致しない場合があります。

## GitHubでのドラフト作成

package.jsonのバージョンと同じtag（例: `v0.1.0`）を作り、そのtagをpushすると、準備したworkflowが以下を実行します。

1. Windows/Linuxで通常のテスト・型検査・配布検証。
2. tagとpackage.jsonのバージョンが一致するか確認。
3. 配布物とハッシュを生成。
4. GitHub Releaseを**ドラフト**として作成し添付。自動公開はしない。

実モデルの評価はCIから起動しません。ActionsにはOpenAIのAPIキーは不要です。draft作成のみGitHubの標準GITHUB_TOKENを使います。tagからのdraft作成workflowはv0.1.0で実行・成功を確認済みです。

ドラフトの説明・添付物・ライセンス・既知の制約を確認した後、初回版は**Pre-release**として手動公開します。通常の安定版やLatestへ昇格させません。公開済みtagを移動・上書きせず、修正時は新バージョンを作ってください。

## 利用者のインストール例

ReleaseからtgzとSHA256SUMSをダウンロードし、SHA-256を確認してください。PowerShellでは `Get-FileHash <tgzのパス> -Algorithm SHA256` が使えます。

```powershell
# npmレジストリから（推奨）
npm install --prefix ./auto-reasoning-plugin opencode-auto-reasoning@0.2.2 --ignore-scripts

# GitHub Releasesのtgzから（SHA-256照合後）
npm install --prefix ./auto-reasoning-plugin ./opencode-auto-reasoning-0.2.2.tgz --ignore-scripts
```

OpenCodeの既存`plugins`へ、インストール先の `auto-reasoning-plugin/node_modules/opencode-auto-reasoning` の絶対パスを追加します。送信・費用を確認してから `allowModelRequests: true` にします。他の設定は [README](../README.md) を参照してください。
