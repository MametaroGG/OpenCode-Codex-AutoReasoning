# Changelog

## Unreleased（2026-11-18）

- OpenAIカタログ98項目を確認し、reasoning effortを持つ32系列すべてにモデル別ポリシーを追加。公開測定に基づく9系列は`benchmark-2026-11-09-r2`のまま維持し、残り23系列は`heuristic-2026-11-18`として能力クラスから設計。両者を状態の`policy`で区別。
- 新規系列はfrontier（low / medium / high / xhigh）とcompact（low / low / medium / high）の2クラス。GPT-6.2 Sol／Astra、GPT-6 Cyber、Daybreak、GPT-5.6 Cyber、GPT-5.6、GPT-5.5 Pro、GPT-5.4 Pro／GPT-5.4、GPT-5.3 Codex、GPT-5.2 Pro／GPT-5.2、GPT-5.1、GPT-5 Pro／GPT-5、o3 Pro／o3をfrontier、GPT-5.4 mini／nano、GPT-5.3 Codex Spark、GPT-5 mini／nanoをcompactに分類。ヒューリスティック行は`max`を自動選択しない。
- Fast／Flex／Pro／UltrafastはカタログAPIの`modelID`が同じ場合に同じ表を適用。`gpt-5.6`を`gpt-5.6-sol`へ、Daybreakを別モデルへ読み替えるような名前推測は行わない。
- カタログvariantによる切上げ（Pro系のmedium下限、旧系列のhigh上限、`gpt-5-pro`のhigh固定）をテストで確認。reasoning variantを持たないモデルは引き続き変更しない。
- README、モデル別ポリシー、検証記録を更新。実モデル呼び出しは0回で、ヒューリスティック表の最適性・節約効果を測定したものではない。
- テストは146件成功。型検査、ビルド、オフラインbenchmark、tarball検証も成功。

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
