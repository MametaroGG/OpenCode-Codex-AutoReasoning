# Phase 1 技術調査

この文書の各Phaseは開発当時の履歴。現行製品の開発用自動調整は`openai`のみ、判定役はLuna専用。複数プロバイダ調整とHaiku選択の試作機能は撤去し、Gemma検証記録は保存している。ローカル・hybrid・Antigravityの実行経路は削除済み。現在の設定と制限は [README](../README.md) を参照。

調査日: 2026-11-09。対象: OpenCode V2 / `@opencode/plugin@2.2.6`。

## OpenCode: 確認した公式仕様

- [Plugin overview](https://opencode.ai/docs/build/plugins): `Plugin.define({ id, setup })`、パッケージのデフォルトexport、`plugins`設定による読み込み。
- [Server API](https://opencode.ai/docs/build/plugins/server): `session.hook("context")` がエージェントループのモデル送信直前に実行される。`options.reasoningEffort` が OpenAI Responses の正式な意味的オプション。呼び出し限定であり履歴・永続設定を変更しない。
- 同hookはツール継続ごとに実行される。`options`は毎回空から始まるため、毎回適用する必要はあるが、難易度の再判定はキャッシュで省略可能。
- `prompt` hook は受付時点ではモデル未解決。今回、未配送の指示が実行中タスクに混ざらないよう、context側に実際に含まれる最後のuserメッセージから判定する。
- [Models](https://opencode.ai/docs/models): 利用可能レベルはモデルによって異なる。`variants[].settings.reasoningEffort` とモデル設定を根拠に選択する。variant名だけで対応を推定しない。
- インストール済み型定義も確認。`ctx.model.list()` は `{ location, data }` を返し、モデル取得用 `get()` は存在しない。モデル能力に推論努力量リストが直接現れるとは仮定しない。
- context hookのモデル参照はvariantを含む。明示variantは自動判定より優先。元の設定はresolved状態でhookに渡らないため、プロバイダから継承した値との同一性まで常に検出できるとは断定しない。
- HTTP body overlayや後続プラグインによる設定は本プラグインの後に上書きできる。その場合、表示するのは本プラグインの選択値であり送信値の保証ではない。

## Antigravity: 存在確認と接続可否は別問題

- [公式Headless mode](https://antigravity.google/docs/cli/headless/): `agy -p`、JSON/stream-json、JSON schema、タイムアウト等が公式に存在する。非対話の自動実行自体は文書化されている。
- 非対話モードは公式CLIで保存済みの認証を使用する。OpenCodeにOAuthトークンを取り出して使わせる必要も理由もない。
- [CLI AI credits](https://antigravity.google/docs/cli/credits/): 利用枠・クレジット消費は契約とCLI設定に依存する。`useG1Credits` による枠超過時のクレジット利用があるため、Googleアカウントを使うだけで無料とは言えない。
- [現行利用規約](https://antigravity.google/terms) 第6項は、第三者ソフトウェア・ツール・サービスによるアクセスを制限し、OpenClaw + Antigravity OAuthを違反例に挙げている。headlessの説明だけでOpenCodeプラグインからの利用が許可されるとは判断しない。契約ごとの例外についても未確認。
- よって今回は呼び出しを**実装しない**。`antigravity.ts`は明示的に失敗する差し替え境界のみ。選択時は元のモデル設定を維持し、ローカル判定へ黙って切り替えることもしない。
- 当初は既存ターミナルでCLIを検出できなかったが、ユーザーによる再起動後に `C:\Users\tyari\AppData\Local\agy\bin\agy.exe` を検出。`agy --version` は **1.5.3**。`agy --help` で `--print`、JSON/stream-json、`--json-schema`、`--print-timeout` 等を実機確認した。バージョン・ヘルプのみ実行し、プロンプト送信・認証情報取得は行っていない。推論実行時の起動時間・メモリ・利用枠は未検証。検出成功によって規約上の接続許可が確認されたわけではない。

## 方針と制限

- ネットワークなし・子プロセスなし・追加AIトークン0のローカル判定を標準にする。
- 指示の構造、ファイル言及数、依存・並行処理・設計・不確実性・品質要求・再試行の複数の特徴を使用する。ただしAIによる意味理解ではなくヒューリスティック。既存ソースの実際の複雑さや依存グラフは取得しない。
- 本格的なAI判定や既存コード解析は将来課題。追加モデル呼び出し、コード送信、課金は事前の明示承認が必要。
- 正式な連携許可が確認された場合に限り、Classifierを差し替える。外部CLIではツール禁止・認証・データ最小化・起動コスト・使用量・タイムアウト・子孫プロセス終了を別途検証する。現状、外部プロセスのタイムアウト実装があるとは主張しない。
- 実モデルへの送信テスト・品質比較・節約率は未検証。料金が発生するベンチマークは実行しない。

## 継続開発: 指示を追加しない状態確認

- [公式RPC API](https://opencode.ai/docs/build/plugins/rpc) の `Rpc.define` と `ctx.rpc.register` により、読み取り専用の `status` メソッドを実装。SDK 2.2.6の型ではイベントなしでも `events: {}` が必要であることを確認した。
- [公式TUI API](https://opencode.ai/docs/build/plugins/cli) の `keymap.layer`、`ui.router.current`、`ui.dialog.alert` を使用し、`/reasoning-status` とパレットコマンドを実装。実行時に現在のclient/locationを参照し、OpenCodeの認証済みRPC経由で状態を読む。
- `./tui` と `./rpc` をパッケージにexport。JSXやネイティブUIコンポーネントを直接使用せず、既存ダイアログに表示する。プラグイン自身のモデル呼び出しやuser指示の追加は行わない。
- モックによるコマンド実行と実パッケージの別consumerへのインストールは確認したが、実TUIでの描画とサーバーのRPCルーティングは未検証。

## 合意した設計: 開発モデル固定、判定モデルのみ指定可能

- ユーザーとの合意により、開発用モデルはユーザーが選択し、本プラグインは変更しない。Lunaなどはあくまで独立した難易度判定役で、開発会話の担当を交代させない。
- 公式server APIの `ctx.experimental.generate.text({ model, prompt }, { signal })` を使用。セッション生成・ツール実行・会話履歴への追加を伴わないため、context hookへ再入する方式を避けられる。
- SDK 2.2.6の型を確認。生成入力は `prompt` と `model`（variantを含む）、戻り値は `{ text }` のみ。使用トークン数・費用は取得できず、出力トークン上限やJSON schemaを渡す入力フィールドもない。未確認のオプションは追加せず、入力文字数・呼び出し回数・同時実行数の制限と厳密な出力検証を実装した。出力検証によって生成済みトークンの課金は取り消せない。
- `hybrid` は明確に狭い修正だけをローカルで処理する。モデル経路の失敗時は元設定を保持し、別モデル・有料APIへ切り替えない。
- 送信許可 `allowModelRequests` は標準false。判定用モデル不在・無効・非chat・非対応variantでは呼び出さない。認証はOpenCodeに任せ、キー・環境変数は取得しない。
- 外部送信対象はprompt hookでファイル・スキル展開前に取得したuser指示のみ。context側のIDと一致しない場合は送信しない。前2件の捕捉済みuser指示は限定的に含めるが、ツール結果・system instructions・展開されたファイル内容は含めない。資格情報除去はベストエフォート。
- [OpenAI公式 reasoning guide](https://developers.openai.com/api/docs/guides/reasoning#preserve-reasoning-across-calls)では、会話履歴と推論状態は別で、モデルファミリー変更時に互換性のない推論状態は引き継がれないと説明されている。これはモデル変更の一律禁止ではないが、ユーザーの懸念を踏まえ開発側の自動切替は実装しない。
- SDK同梱のOpenAI ResponsesプロトコルはGPT-6以降でeffort update対応を検出する処理を持つ。ただしpro modeや自動compaction等で条件が異なる。プラグインがraw bodyを独自に書き換えるのではなく、公式の意味的reasoningEffortオプションを通じてOpenCodeに処理を任せる。実送信・キャッシュ・推論状態の維持は未検証。

## 実モデル評価の追記

ユーザーから最大48回の呼び出し許可を得た後、公式の独立生成APIを通じてGPT-6 Luna lowの判定を実測した。24課題×2回で期待ラベルとの一致44/48、比較したローカル判定は14/48。方法・全体集計・限界は [ACCURACY.md](ACCURACY.md) に記録。評価中にプロンプトやラベルの調整は行わず、追加の再試行・他モデルへの切替も行っていない。

これは独立した判定生成経路の検証であり、開発用モデルの送信、会話推論状態の維持、稼働中のプラグインのprompt ID対応、コード品質、節約額を検証したものではない。応答時間にはCLI起動のオーバーヘッドも含む。
