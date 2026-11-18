# Changelog

## 0.2.6 — ローカル計測ログ（2026-11-18）

- `measurement: true`で、難易度・推奨／選択思考量・選択方針・判定時間・キャッシュ命中・開発モデルIDと、ホスト発行の`session.usage.updated`によるトークン／費用を上限付きローカルログへ記録できるようにした（既定false、外部送信なし、アンロード時に消去）。
- 指示文・ファイルパス・認証情報・生のセッションIDは保存しない。セッション参照はsha256の先頭16文字。読み取りは既存の`auto_reasoning_status`／RPCの`measurement`フィールドのみで、読み取り専用性は維持。
- この記録は選択と使用量を後から突き合わせるためのもので、節約効果の実証ではない。プラグイン実環境での效果的比較は引き続き未測定。

## 0.2.5 — SDK 2.3.2対応（2026-11-18）

- `@opencode/plugin`を2.2.6から2.3.2へ更新。型検査・146件のテスト・ビルド・オフライン配布検証が新しいSDKで成功。実機HTTP送信の確認は2.2.6のままであることをREADMEに明記。
- README日本語版・英語版をフロー図と表を中心にした最小構成へ書き換え。バージョン固定の推奨、`v0.2.0以降`や「執筆時点の最新版」のような開発時点の記述、旧Pre-releaseの履歴を削除。GitHub ReleaseとGitHub Packageのバッジを動的／汎用表示に変更。
- READMEの英語版`README.en.md`を追加し、日本語版と相互リンク。npm配布物にも英語版READMEを含める。GitHub Release本文とリリースノートも日本語／英語の二言語化。

## 0.2.4 — npm公開（最終名，2026-11-18）

- npmパッケージ名を最終名の`opencode-codex-autoreasoning`へ変更。`opencode-codex-reasoning`として用意した0.2.3もnpmには公開されず、この名前も空きでした。0.2.3のGitHub Release・タグは公開済みのため変更せず、0.2.4として正式名で公開しました。
- `package.json`・lockfile・README・リリースノート・配布検証スクリプトの名前とインストール手順を更新。GitHub Releasesのtgz名も`opencode-codex-autoreasoning-0.2.4.tgz`です。
- Lunaの精度・モデル別ポリシー・テスト146件の結果は変更なし。監査警告はmoderate 23件・high 5件・criticalなし。
- GitHub Release v0.2.4をPre-releaseから通常Releaseへ昇格。npmレジストリへの公開とクリーンインストールも確認済み。GitHub Packagesにも`@mametarogg/opencode-codex-autoreasoning@0.2.4`を公開（Actionsの`GITHUB_TOKEN`と`workflow_dispatch`ワークフロー）。既存の制限（実HTTP送信・Desktop/native TUI・実利用の品質と節約の未検証）は変わらない。

## 0.2.3 — npm公開準備（2026-11-18）

- npmパッケージ名を`opencode-codex-reasoning`へ変更しましたが、**npm公開は完了していません**。0.2.2で使っていた`opencode-auto-reasoning`は誤りで、npmには同名の`0.0.0-stage`プレースホルダーだけが作られていました。0.2.2のGitHub Release・タグは公開済みのため変更しません。
- `package.json`・lockfile・README・リリースノート・配布検証スクリプトのパッケージ名とインストール手順を更新。GitHub Releasesのtgz名も`opencode-codex-reasoning-0.2.3.tgz`になります。
- Lunaの精度・モデル別ポリシー・テスト146件の結果は0.2.2から変更なし。監査警告はmoderate 23件・high 5件・criticalなし。

## 0.2.2 — npm公開準備（2026-11-18）

- `private`を解除し、`publishConfig.access: "public"`を設定。READMEとリリースノートにnpmインストール手順を追加しましたが、2FAと名前違いのため**プラグイン本体のnpm公開はこの版では完了していません**。GitHub Releasesの`.tgz`と`SHA256SUMS`は配布済みです。
- READMEとリリースノートにnpmからのインストール手順を追加。GitHub Releasesの`.tgz`と`SHA256SUMS`も引き続き配布し、公開済みv0.1.0／v0.2.0／v0.2.1のタグ・添付ファイルは変更しない。
- Lunaの精度は2026-11-08の44/48（91.7%）を参照。判定promptとJSON検証は測定時から変更していないが、判定実装のハッシュは異なる（既定タイムアウト3秒→15秒の変更）。同一コードでの再測定は行っていない。
- テスト146件成功。型検査、ビルド、オフラインbenchmark、tarball検証、npm公開のdry-runも成功。監査警告はmoderate 23件・high 5件・criticalなし。

## 0.2.1 — 試用版（2026-11-18）

- OpenAIカタログ98項目を確認し、reasoning effortを持つ32系列すべてにモデル別ポリシーを追加。複数ベンチマークで再検討した14系列（既存9系列の`benchmark-2026-11-09-r2`と新規5系列の`benchmark-2026-11-18-r2`）、思考量別sweepを1つだけ確認した7系列（`benchmark-2026-11-18-r1`）、残り11系列（`heuristic-2026-11-18`）を状態の`policy`で区別。
- 追加12系列をLiveBenchの生の思考量別行、OckBench、Artificial Analysisの個別coding評価、Cognition FrontierCodeで再検討。GPT-6.2 Sol／Astra、GPT-5.4、GPT-5.4 mini、GPT-5.2の5系列を`benchmark-2026-11-18-r2`へ昇格。GPT-6.2 SolのVery Highのみxhigh→maxへ修正し、他4系列はプロファイルを維持。6.2 SolはAAのTerminal-Bench 4.0とFrontierCode-AA 2.0の両方でmaxがxhighを上回り、Astraはxhighが同等以上でした。
- GPT-5.4 nano、GPT-5.3 Codex、GPT-5.1、GPT-5、GPT-5 mini／nano、o3の7系列は思考量別sweepが1つだけのため`benchmark-2026-11-18-r1`に残し、単一ソースの暫定ポリシーとして明記。単点（5.4のDeepSWE xhigh、5 miniのOckBench-Math high）は2つ目のsweepとして数えない。
- 残る11系列（GPT-6 Cyber、Daybreak、GPT-5.6 Cyber、GPT-5.6、GPT-5.5 Pro、GPT-5.4 Pro、GPT-5.2 Pro、GPT-5 Pro、o3 Pro、GPT-5.3 Codex Spark）は、同条件の思考量別sweepがないためfrontier／compactの暫定表を維持。ヒューリスティック行は`max`を自動選択しない。
- Fast／Flex／Pro／UltrafastはカタログAPIの`modelID`が同じ場合に同じ表を適用。`gpt-5.6`を`gpt-5.6-sol`へ、Daybreakを別モデルへ読み替えるような名前推測は行わない。
- カタログvariantによる切上げ（Pro系のmedium下限、旧系列のhigh上限、`gpt-5-pro`のhigh固定）をテストで確認。reasoning variantを持たないモデルは引き続き変更しない。
- README、モデル別ポリシー、検証記録を更新。実モデル呼び出しは0回で、ヒューリスティック表の最適性・節約効果を測定したものではない。
- テストは146件成功。型検査、ビルド、オフラインbenchmark、tarball検証も成功。
- 配布物は`opencode-auto-reasoning-0.2.1.tgz`と`SHA256SUMS`。npmレジストリは引き続き未公開（`private: true`）。公開済みv0.2.0のタグ・添付ファイルは変更しない。Lunaの判定promptは2026-11-08の精度測定から変更しておらず、[ACCURACY.md](docs/ACCURACY.md)の44/48（91.7%）を引き継ぐ。

## 0.2.0 — 試用版（2026-11-09）

- 複数の独立評価を比較したr2へ更新。6.1 SolのVery Highをhigh→xhigh、6 LunaのVery Highをxhigh→max、5.6 TerraのHighをmax→xhighに変更。他6系列は維持。異なる評価での反証・費用条件・適用限界をdocs/MULTI-BENCHMARK-REVIEW.mdへ記録。

- Lunaの難易度と開発モデルの思考量選択を分離。6.1 Sol／Terra、6 Astra／Sol／Luna、5.6 Sol／Terra／Luna、5.5の全9系列に各モデルの一次ベンチマークを参照した暫定ポリシーを適用。共通表への自動fallbackは未知モデル・API ID不明のみ。Fast版はカタログのAPI modelIDで解決。
- max対応と既定maxEffortのmaxへの拡張。明示xhigh上限は維持。modelPolicy: commonで従来表へ戻せる。
- 状態に適用方針と制約適用前の推奨値を追加。追加の実モデル試験なし。公開済みv0.1.0は変更しない。

- リポジトリをMametaroGG/OpenCode-Codex-AutoReasoningへ改名し、案内・パッケージメタデータのURLを更新。
- CLI/API経由の実機検証済み範囲と、Desktop未検証・専用状態表示未実装を明記。
- 公開済みv0.1.0のタグ・配布物・SHA-256は変更しない。

## 0.1.0 — 試用版（2026-11-09）

- 実OpenCode 2.2.6でLuna判定2回＋Sol生成2回を実行。low/xhighが最終HTTP本文に反映され、両方HTTP 200で完了したことを確認。
- variant省略時に実ホストが付ける`default`を明示指定と誤認する不具合を修正。同名の実variantと他の明示variantは引き続き保持。

- 開発側は`openai`プロバイダに限定。試作の複数プロバイダ変換処理を撤去し、非OpenAIでは手動設定時も判定・調整を行わない。
- 明示variant・既存思考量overrideを保持し、未知方式・混在設定は変更しない。確認できたreasoningEffort値のみ使用。

- Luna専用の思考量判定。ローカル・hybrid・Antigravityの実行経路を削除。
- 開発用モデルはユーザーが選択し、プラグインは変更しない。
- 既定の判定モデルは `openai/gpt-6-luna#low`、タイムアウトは15秒。
- 判定モデルはGPT-6 Luna（openai/opencode）に限定。試作のHaiku選択機能を撤去。Gemma検証は履歴として保存。
- 明示的な送信許可、回数制限、入力最小化、キャッシュ、失敗時の設定保持。
- `/reasoning-status`、モックテスト、オフライン配布検証。
- GitHub CI、タグからのドラフトリリース、SHA-256付き配布物の生成を準備。
- 公開先をMametaroGG/OpenCodeCLI-Codex-AutoReasoningに改名。MITライセンス、パッケージ名とplugin IDは維持。

GitHub上ではPre-releaseとして配布する初回試用版。npmレジストリは未公開。native TUI描画・WebSocket・日常開発での品質や節約効果は未検証。
