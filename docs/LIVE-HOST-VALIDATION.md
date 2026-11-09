# 実OpenCodeホストでの動作検証

実行日: 2026-11-09 / Windows / OpenCode 2.2.6。

## 結論

**実ホストへのプラグインロード、prompt/contextのメッセージID対応、Luna判定、Solへ送るHTTP本文のreasoning effort、状態RPCまで成功した。** native TUI描画・WebSocket・長時間のツール継続は未検証。

| 合成課題 | Luna判定 | 選択努力量 | Sol送信本文 | HTTP応答 | セッション結果 |
|---|---|---|---|---|---|
| 表示文字列の誤字修正（vl-01） | Very Low | low | reasoning.effort = low | 200 | succeeded |
| 分散決済台帳の復旧設計（vh-01） | Very High | xhigh | reasoning.effort = xhigh | 200 | succeeded |

- 開発用モデルはユーザー選択の `openai/gpt-6.1-sol`。判定役は `openai/gpt-6-luna#low`。
- 許可範囲は最大4生成。実行はLunaの独立生成2回＋Solのprimary HTTPリクエスト2回。明示的な再試行なし。
- Lunaの判定時間は約2.78秒と約2.52秒。CLIからの外側の往復時間ではなく、実プラグイン内の計測値。
- admission時とcontext時のuserメッセージIDが一致し、元の合成指示だけを分類に使用した。
- セッションのモデル参照は、作成後にOpenCodeが保持した `openai/gpt-6.1-sol#default` から変更されなかった。
- 実RPCを追加で読み取っても分類回数は増えなかった。
- Solのセッション使用量は観測できたが、Luna生成の使用トークン・請求額はAPIから取得できずnull。セッション側の表示cost=0を無料・請求額ゼロの証明とはしない。

## 発見して修正した不具合

OpenCode 2.2.6はvariantを省略したセッションにも `variant: "default"` を付ける。従来は任意のvariantをユーザーによる明示指定とみなし、自動調整をスキップしていた。

修正後は、**カタログに実在する同名variantがない場合に限り** `default` を自動選択のsentinelとして扱う。`#high`等の明示variantや、ユーザーが実際に定義した `default` variantは引き続き保護する。回帰テストとインストール済みtarballの検証を追加した。

## 検証の構成と安全策

- 本体のビルド済みパッケージと、テスト専用observerを実OpenCodeの `plugins` からロードした。モックホストで `setup` を直接呼ぶ試験ではない。
- 専用プロジェクトは `C:/Users/tyari/AppData/Local/Temp/opencode/auto-reasoning-host-v4`。グローバル設定・認証情報・既存セッションは変更していない。
- fixtureの合成課題2件だけをユーザー入力として送信。期待ラベルや実プロジェクトのファイルは送信しない。
- observerはLuna分類の**後**に開発側のsystemをテスト用の短文に置き換え、ツールを除去し、出力上限1024にした。開発モデルは実際の課題を実装せず、OKと応答する通信試験である。観測した思考量は書き換えていない。
- 専用primary agentは1ステップ。タイトルは固定文字列、compactionはローカル結果、session retryは無効化。外部生成はLuna判定とSolの2ターンに限定した。プロバイダ内部の再試行は完全には観測できない。
- HTTP transportとencoding=noneを専用プロジェクトで指定。HTTP hookが本文のコピーからモデルID・努力量・出力上限だけを記録し、ヘッダー・認証情報・本文全体は保存しない。
- 分類失敗・モデル変更・送信努力量不一致・追加ターンはobserverのガードで停止する。
- 終了時にテストセッションをinterruptし、専用設定の `allowModelRequests` をfalseへ戻した。追加のプロンプトから勝手に分類できる状態にはしていない。

## 台帳と起動時の試行

- 実装: `scripts/verify-live-host.ts`、`scripts/fixtures/live-host-observer/`。配布パッケージには含めず、CIからも起動しない。
- 成功結果: `evaluation-results/live-host-v4/report.json`、`ledger.jsonl`。
- v1・v2は初期registry snapshotが空の時点でチェックして停止。モデル呼び出し0回。初回のplugin.listはロード完了を保証しないため、RPCとsettlement後の一覧を確認する形に検査を修正した。
- v3は上記default variant不具合を検出。Luna呼び出し0回、observerが開発モデル送信前に停止した。
- v4で修正を再確認し、許可された4生成を実行して成功。以前の台帳は上書きしていない。
- スクリプトの再確認モードは、以前の試行で外部生成がなかった証跡を要求する。各台帳は排他作成により再実行を拒否する。今回の許可枠は使用済みであり、追加実行は別途承認が必要。

## この試験では保証しないこと

- 2課題の通信・制御確認であり、一般的な分類精度、実装品質、トークン節約の証明ではない。
- native TUIのロード・ダイアログ描画とWebSocketの最終フレームは未確認。
- 明示variant・既存override・キャッシュ・ツール継続等は主に単体テストの範囲。実ホストでの全組合せは未確認。
- 実ホストではローカルのビルド済みソースをロード。インストールしたtarballの検証は別のオフラインモックホスト試験である。
