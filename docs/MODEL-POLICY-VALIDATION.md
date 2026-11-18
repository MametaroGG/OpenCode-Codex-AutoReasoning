# モデル別ポリシー変更の検証（2026-11-18）

2026-11-18のカタログ拡張後、下記の全コマンドを再実行して成功しました。reasoning effortを持つ32系列を、r2の9系列（`benchmark-2026-11-09-r2`）、2026-11-18に追加した12系列（`benchmark-2026-11-18-r1`）、ヒューリスティック11系列（`heuristic-2026-11-18`）に分けて検証しています。[ポリシーと根拠の区別](MODEL-POLICIES.md)を参照してください。

| 検証 | 結果 |
|---|---|
| npm run typecheck | 成功 |
| npm test | 146件成功、失敗なし |
| npm run build | 成功 |
| npm run benchmark | 成功。固定応答の検証・キャッシュ・保持上限のみ |
| npm run verify:package | オフラインで実tarballをインストールし、モックホスト検証成功 |
| git diff --check | 成功 |

## カタログ確認

2026-11-18に実行中OpenCodeの`GET /api/model`と`opencode models`を確認しました。OpenAIの有効なカタログ項目は98件で、そのうちreasoning effortを持つAPI `modelID`は32件です。Fast／Flex／Pro／Ultrafastは独立したAPIモデルではなく、同じ`modelID`を共有する別名でした。例えば次のとおりです。

- `gpt-6.2-sol`／`-fast`／`-pro`／`-ultrafast` → `gpt-6.2-sol`
- `gpt-6.1-terra`／`-fast`／`-flex`／`-pro` → `gpt-6.1-terra`
- `gpt-5.6`／`-fast`／`-pro` → `gpt-5.6`（`gpt-5.6-sol`ではない）
- `gpt-5.5-pro`、`gpt-daybreak-blue-latest`、`gpt-daybreak-red-latest`は独立ID

ポリシーはこの`modelID`を完全一致で引きます。`-fast`等の末尾を削る推測は行いません。

## テスト範囲

- r2の9系列：各4難易度の値と`benchmark-2026-11-09-r2:<modelID>`を検証。通常／Fastのcontext hook配線、キャッシュ再利用、モデル変更を含みます。
- 2026-11-18の12系列：各4難易度の値と`benchmark-2026-11-18-r1:<modelID>`を検証。GPT-6.2、GPT-5.4系、GPT-5.3 Codex、GPT-5.2／5.1、GPT-5系、o3を含みます。
- ヒューリスティック11系列：frontier／compactの各4難易度と`heuristic-2026-11-18:<modelID>`を検証。
- 12系列と11系列の主要なFast／Flex／Pro／Ultrafast別名、カタログ上限によるクランプを検証。
- frontier系、compact系、合計32系列が`common`へ落ちないことを検証。
- reasoning variantを持たない`chat-latest`、`gpt-audio-1.5`、`gpt-5-search-api`、GPT-4.1／GPT-4o系は、自動選択の対象外であることを検証。
- Pro系のmedium下限、`gpt-5.1`／`gpt-5`／`gpt-5-mini`／`gpt-5-nano`／`o3`／`o3-pro`のhigh上限、`gpt-5-pro`のhigh固定など、カタログに合わせた切上げを検証。
- 未知ID（`gpt-6.1-terra-fast`、`gpt-6.2-sol-fast`等をmodelIDとして直接渡すケースを含む）は`common:no-model-evidence`のまま。

従来の非OpenAI除外・判定失敗時の保持・明示variant・既存override・cleanup等の回帰テストも成功しています。依存関係のdeprecated警告は継続しています。

**実モデル呼び出しは0回**です。146件はLuna分類精度、ヒューリスティック表の最適性、実送信、節約効果の証拠ではありません。Desktop／native TUI描画も未検証です。新しい一次ベンチマークが公開された系列は、測定行へ昇格させるか表を改訂してください。
