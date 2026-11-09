# Changelog

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
