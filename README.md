# OpenCode Codex Auto Reasoning

OpenCode **V2**向けのTypeScriptプラグインです。**GPT-6 Lunaだけ**で指示の難易度を判定し、**`openai`プロバイダの開発用モデルだけ**の思考量を送信直前に調整します。

本体はサーバー側で動作するためCLI専用の設計ではありません。ただし、実機確認済みなのはCLI/API経由のOpenCode 2.2.6です。**Desktop版は未検証**であり、現在の状態表示UIはTUI用です。Desktop専用の状態表示は未実装です。

- **開発用モデルはユーザーが選択。プラグインは変更しません。**
- 誤字修正も難しい実装も選択した判定モデルで判定。同じ指示はキャッシュします。
- ローカル判定、hybrid、Antigravity、別モデルへの自動切替はありません。
- 判定失敗・タイムアウト・未許可時は、元の開発用設定を保持します。
- 外部送信は標準で無効。`allowModelRequests: true` が必要です。

初回の実Luna検証は24課題×2回で期待ラベルとの一致率91.7%。小規模な合成評価であり、実装品質や節約効果を保証しません。[精度検証](docs/ACCURACY.md)を参照してください。**実OpenCode 2.2.6で本体ロード・prompt ID対応・Luna判定・Solへのlow/xhigh送信・HTTP 200・状態RPCを確認済み**です。[実ホスト検証](docs/LIVE-HOST-VALIDATION.md)。native TUI描画とWebSocketは未確認です。

無料のGemma 4を判定役にする追加検証は、初回の生成APIがHTTP 502で失敗したため保留中です。判定能力は未評価で、現在の設定からは選択できません。[調査記録](docs/GEMMA-EVALUATION.md)。

## 導入

Node.js 22以上、OpenCode V2（SDK 2.2.6対応）が必要です。V1には非対応です。

### ソースから

```powershell
git clone https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning.git
cd OpenCode-Codex-AutoReasoning
npm ci
npm run build
```

利用先の `opencode.jsonc` の既存 `plugins` 配列に要素を**追加**します。既存設定全体を置き換えないでください。

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      // 実際にclone/buildしたフォルダの絶対パスへ変更。
      "package": "C:/path/to/OpenCode-Codex-AutoReasoning",
      "options": {
        "classifierModel": "openai/gpt-6-luna#low",
        // 入力送信・料金・データ方針に同意した場合だけ true に変更。
        "allowModelRequests": false,
        "timeoutMs": 15000
      }
    }
  ]
}
```

APIキーはこの設定に書かず、OpenCodeで接続済みのプロバイダを使います。利用枠・料金を確認してから許可を有効にしてください。既定の最大100回は**インスタンス単位のSDK呼び出し上限**であり、金額の上限ではありません。

### 判定役と開発用モデル

判定役は **GPT-6 Luna専用**です。OpenCodeで `openai` または `opencode` 経由のLunaが利用可能であることが必要です。Haiku・Gemini・Gemmaは判定役として選択できず、利用できない場合も別モデルへ切り替えません。

開発用モデルはユーザーが選びますが、自動調整の対象は **`openai`プロバイダのみ**です。Claude・Gemini・Bedrock・OpenAI互換のカスタムプロバイダ・`opencode`経由の開発用モデルは変更せず、Luna判定も呼びません。手動overrideも非OpenAIには適用しません。判定役としての`opencode/gpt-6-luna`は引き続き指定可能です。

通常は設定保存で再読み込みされます。必要なら `/reload`。送信済みのリクエストは変えません。再読み込み前の指示を遡って送信せず、新しい指示から利用します。

### 全プロジェクト共通

同じ要素を `~/.config/opencode/opencode.jsonc`（`XDG_CONFIG_HOME`設定時はその配下）の `plugins` に追加します。絶対パス推奨。プロジェクト側で二重登録しないでください。端末用 `cli.json` ではありません。本開発中にグローバル設定は変更していません。

### GitHub Releasesからの配布

公開リポジトリは [MametaroGG/OpenCode-Codex-AutoReasoning](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning)、ライセンスは [MIT](LICENSE) です。互換性のため、パッケージ名`opencode-auto-reasoning`とplugin IDは維持しています。ローカルフォルダ名は任意です。

**[GitHub Releases](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases)のPre-release（試用版）**として`.tgz`と`SHA256SUMS`を配布し、普段の開発での確認後にnpm公開を検討します。**npmレジストリはまだ未公開**なので、パッケージ名だけでインストールしないでください。モデル別ポリシーr2はv0.2.0から含まれます。既存のv0.1.0配布ファイルは変更しません。

Releaseの2ファイルをダウンロードし、`Get-FileHash ./opencode-auto-reasoning-0.2.0.tgz -Algorithm SHA256`でハッシュを照合した後、インストールします。

```powershell
npm install --prefix ./auto-reasoning-plugin ./opencode-auto-reasoning-0.2.0.tgz --ignore-scripts
```

既存`plugins`の`package`には、インストール先の`auto-reasoning-plugin/node_modules/opencode-auto-reasoning`の絶対パスを指定します。外部送信は既定で無効です。利用権・料金・データ方針を確認してから`allowModelRequests: true`にします。詳細は [RELEASING.md](docs/RELEASING.md)。検証の要約と合成fixtureは公開し、生の評価ログ・テストセッションIDはローカルに保存して公開対象から除外しています。

## 思考量の選択

共通フォールバック表（モデル別表がない場合、または`modelPolicy: "common"`）：

| 難易度 | 要求する思考量 |
|---|---|
| Very Low | low |
| Low | medium |
| High | high |
| Very High | xhigh |

開発側は`openai`に限定し、モデル設定・variantに実在する`reasoningEffort`だけを使用します。variant名やモデル名だけでは対応と判定しません。他プロバイダの`effort`・`thinking`・思考予算を変換する試作処理は撤去しました。

Lunaの難易度判定後、開発モデルのAPI modelIDに応じて思考量を選びます。**6.1 Sol／Terra、6 Astra／Sol／Luna、5.6 Sol／Terra／Luna、5.5の全9系列**に、それぞれの公開ベンチマークを参考にした個別ポリシーを適用します。Fast版は実際のAPI modelIDが同じ場合に表を共有します。未知モデル・API ID不明のみ上記共通表へ自動fallbackします。**最適値の実証ではなく暫定方針**です。[全対応表・出典・限界](docs/MODEL-POLICIES.md)。`modelPolicy: "common"`で従来表へ戻せます。

利用可能なminimal / low / medium / high / xhigh / maxを確認し、min/maxの範囲内で切り上げ、なければ範囲内の最大対応値へフォールバックします。対応不明・設定方式の混在・範囲内に値がない場合は変更しません。`minimal`は最小値を下げて手動指定する場合に使用可能です。`none`は自動選択せず、明示variantや既存request overrideは保持します。

現在のr2は[複数の独立ベンチマークを比較](docs/MULTI-BENCHMARK-REVIEW.md)し、6.1 Solの最難をxhigh、6 Lunaの最難をmax、5.6 TerraのHighをxhighに見直しました。評価間の不一致・timeoutリスクも記録しています。自動割当の最適性や実利用の節約を実証したものではありません。

OpenAI向け処理は、実ホスト上のSolへの2ターンで最終HTTP本文と正常応答まで確認しました。開発成果物の品質・節約効果、全OpenAIモデルの動作を保証するものではありません。

優先順位は、無効化 → 他プラグインの既存request override保持 → 手動指定 → 明示model variant保持 → モデル判定。手動指定にもモデル対応範囲・min/maxを適用します。

OpenCodeがvariant未指定時に付ける`default`は、同名の実variantがカタログにない場合だけ自動調整の対象として扱います。カタログに定義された`default` variantは通常の明示指定として保持します。

## 設定

OpenCodeがJSON/JSONCを解釈し、`plugins[].options`として渡します。[全設定例](examples/opencode.jsonc)・[Luna設定例](examples/luna.jsonc)。

| キー | デフォルト | 説明 |
|---|---|---|
| enabled | true | falseで手動指定も含め変更しない |
| engine | model | 互換用。modelのみ指定可能、省略推奨 |
| modelPolicy | benchmark | モデル別暫定表。commonで従来の共通表 |
| classifierModel | openai/gpt-6-luna#low | openai/opencodeのGPT-6 Lunaのみ。variantはカタログで確認 |
| allowModelRequests | false | 入力送信・契約に応じた課金への明示的許可 |
| maxModelRequests | 100 | ロードから停止までのSDK呼び出し上限、1〜10,000 |
| modelMaxInputChars | 2000 | user指示部分の合計文字数上限、1〜8000。固定の判定用指示は別 |
| minEffort | low | minimal / low / medium / high / xhigh / max |
| maxEffort | max | 同上。最小値未満は不可。既存の明示xhigh上限は維持 |
| defaultEffort | medium | 互換用の最終既定値。通常は判定モデルの明示判定を使用し、失敗時には適用しない |
| manualOverride | null | 努力量を固定。nullでモデル判定へ戻す |
| timeoutMs | 15000 | 判定の制限時間、1〜60,000ms |
| cacheTtlMs | 1800000 | キャッシュと状態のTTL、1〜86,400,000ms |
| maxEntries | 256 | 各キャッシュと同時判定の上限、1〜4096 |
| debug | false | 努力量・難易度・キャッシュ命中のみ出力 |

選択した判定モデルのカタログIDが別のAPIモデルに差し替えられている場合も拒否します。無効・不在・非chat・未知のvariantの場合は、別モデルへ切り替えません。Geminiは判定役・開発用の自動調整とも対象外です。

### 旧設定からの移行

v0.2.0のモデル別対応では、既定上限を`xhigh`から`max`に変更しました。上限を維持したい場合は`maxEffort: "xhigh"`を明記してください。従来の共通表は`modelPolicy: "common"`で選択できます。公開済みv0.1.0の配布物にはモデル別表・max対応は含まれません。

`engine: "local"`、`"hybrid"`、`"antigravity"` は削除するか `"model"` に変更してください。試作中のHaiku判定設定も廃止し、Luna以外の`classifierModel`は拒否します。不正値・不明なキーはプラグイン全体を無効化し、黙って有料送信へ移行しません。Lunaへの変更・`allowModelRequests`の有効化は利用権・送信・料金を確認の上で明示的に行ってください。

タイムアウトの既定値は3秒から**15秒**へ変更しました。初回実測はCLI起動込みで最大約12.4秒だったための余裕であり、15秒以内の応答を保証するものではありません。

## 状態確認

セッションで **`/reasoning-status`** またはパレットの **Auto Reasoning: 状態を表示** を使います。読み取り専用RPCから選択値・理由・難易度・キャッシュ命中・判定時間を表示し、新しいuser指示やモデル呼び出しは追加しません。`./tui`部分がサーバー部分とともに読み込まれ、追加の `cli.json` 設定は不要です。

v0.2.0では選択方針`policy`と、制約適用前の`requestedEffort`も表示します。`effort`はモデル対応範囲・min/max適用後です。

ツール `auto_reasoning_status` は詳細な状態も返します。ただし通常の指示でツール使用を依頼すると、その依頼自体が新しい判定対象になります。元のタスクを見る場合はスラッシュコマンドを使ってください。

- `metrics`: 判定回数、キャッシュ命中、失敗、累計判定時間。生成が1回でも発生すると `additionalTokens` はnull（不明）。0トークンの意味ではありません。
- `classifier.modelUsage`: SDK呼び出し回数、実行中件数、許可・上限等による拒否、送信したuser指示の文字数。請求額やSDK内部リトライ回数ではありません。
- `usage`: 最後に観測した `session.usage.updated` のセッション使用量。判定モデルの独立生成を含むとは仮定しません。
- `retained`: 上限付きキャッシュの保持件数。TTLはアクセス時に評価し、期限切れも保持上限を超えません。

UIのモデルvariant表示自体は変えません。通常の状態表示は本プラグインの要求値であり、後続hookやraw body overlayによる最終送信値の変更を監視するものではありません。今回の実ホスト試験では別のobserverで最終HTTP本文を検査しています。

## 安全性と制限

- ファイル・スキル展開前のprompt hookで捕捉したuser指示だけを送信。前2件は各500文字以内、現在指示と合わせた文字数を制限します。system instructions・ツール結果・展開後のソースを代用しません。ID対応が取れなければ元設定を保持します。
- コードフェンス・一般的な資格情報を除去しますが、秘密情報を完全に検出できる保証はありません。機密作業は `enabled: false` または `allowModelRequests: false` とし、思考量はユーザー側で設定してください。
- 同一指示はキャッシュし、ツール継続では再判定しません。失敗もTTL内はキャッシュします。
- 外部判定はインスタンスあたり同時1件。実行中の場合、別セッションの設定を流用せず元設定を保持します。
- タイムアウト・停止時にAbortSignalを渡しますが、サーバー側の推論・課金停止は保証しません。中止を無視する要求が残っている間は追加の外部判定を開始しません。
- 回数上限は再読み込みでリセットされ、プロジェクトごとのインスタンスに分かれます。出力トークン上限を渡せない実験的APIのため、厳密な請求額上限にはプロバイダ側の予算設定が必要です。
- APIキー・環境変数・認証情報を収集せず、プロンプト・例外本文をログに出しません。
- SDKの推移依存にmoderateの監査警告があります。[検証結果](docs/VALIDATION.md)を参照してください。

## 開発・検証

```powershell
npm run typecheck
npm test
npm run build
npm run benchmark
npm run verify:package
npm run release:pack
```

通常のテストはモデル応答をモック化し、実モデルを呼びません。`benchmark` は固定Luna応答の検証・キャッシュ・5万件の保持上限を測るオフライン試験で、モデル精度や速度の測定ではありません。旧ローカル判定は比較履歴の再現用に `scripts/baselines/` に隔離し、実行時にも配布物にも含めません。

`verify:package` は実tarballを別の一時consumerへオフラインインストールし、許可ゲート・Luna判定／OpenAI向けprompt/context/状態RPC/cleanupと非OpenAIの設定保持をモックホストで実行します。npmキャッシュの準備に `npm ci` が必要です。実サーバーのプラグインローダーを検証するものではありません。

実モデル評価は[精度検証](docs/ACCURACY.md)・[実ホスト検証](docs/LIVE-HOST-VALIDATION.md)を参照してください。実ホスト試験では別の承認でLuna 2回＋Sol 2回を使用しました。以前の精度評価・Gemma試験の台帳は上書きせず保持しています。今回の許可枠は使用済みで、追加の外部送信・費用には別途承認が必要です。
