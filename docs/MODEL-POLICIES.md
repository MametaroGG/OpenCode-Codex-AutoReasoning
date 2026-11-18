# モデル別思考量ポリシー（2026-11-18、測定9系列・ヒューリスティック23系列）

## 実装と根拠の区別

Lunaは課題の難易度だけを分類し、その後、開発用モデルのカタログ`modelID`で対応表を選びます。判定prompt・JSON検証は変更していません。**以下は公開測定または能力クラスを参考に設計した暫定方針であり、難易度別の最適値を実証した表ではありません。** この変更で追加の実モデル呼び出しは行っていません。

2026-11-18時点のOpenAIカタログ98項目を確認し、reasoning effortを持つ32のAPI `modelID`をすべて収録しました。内訳は、公開測定を参照した9系列（`benchmark-2026-11-09-r2`）と、公開された思考量sweepがない23系列（`heuristic-2026-11-18`）です。**ヒューリスティック行はベンチマーク結果ではなく、能力クラスに基づく暫定方針です。** 状態の`policy`欄で両者を区別できます。

### 公開測定に基づく9系列

VulcanBenchに加え、Datacurve DeepSWE、Artificial Analysisの個別coding評価、Hex DataBench等を比較しました。[複数ベンチマークの比較・維持／変更理由](MULTI-BENCHMARK-REVIEW.md)がr2の根拠です。

| API modelID | Very Low | Low | High | Very High |
|---|---|---|---|---|
| gpt-6-astra | low | low | medium | xhigh |
| gpt-6.1-sol | low | medium | high | xhigh |
| gpt-6.1-terra | low | high | xhigh | max |
| gpt-6-luna | low | high | xhigh | max |
| gpt-6-sol | low | medium | xhigh | max |
| gpt-5.6-sol | low | medium | xhigh | max |
| gpt-5.6-terra | low | high | xhigh | max |
| gpt-5.6-luna | low | high | xhigh | max |
| gpt-5.5 | low | high | xhigh | xhigh |

一覧の9系列はすべて、それぞれの一次報告を参照した個別ポリシーを持ちます。同じ対応表になる系列も、別々の測定に基づいて採用しています。世代や名称の類似だけで結果を流用しません。

### ヒューリスティック23系列

公開された思考量別の一次評価を確認できない系列は、能力クラスに基づく2種類の暫定表で明示的に収録します。未知IDの共通表へ黙って落とすのではなく、モデル名ごとに方針を固定するための措置です。

| API modelID | クラス | Very Low | Low | High | Very High |
|---|---|---|---|---|---|
| gpt-6.2-sol | frontier | low | medium | high | xhigh |
| gpt-6.2-astra | frontier | low | medium | high | xhigh |
| gpt-6-cyber | frontier | low | medium | high | xhigh |
| gpt-daybreak-red-latest | frontier | low | medium | high | xhigh |
| gpt-5.6-cyber | frontier | low | medium | high | xhigh |
| gpt-daybreak-blue-latest | frontier | low | medium | high | xhigh |
| gpt-5.6 | frontier | low | medium | high | xhigh |
| gpt-5.5-pro | frontier | low | medium | high | xhigh |
| gpt-5.4-pro | frontier | low | medium | high | xhigh |
| gpt-5.4 | frontier | low | medium | high | xhigh |
| gpt-5.3-codex | frontier | low | medium | high | xhigh |
| gpt-5.2-pro | frontier | low | medium | high | xhigh |
| gpt-5.2 | frontier | low | medium | high | xhigh |
| gpt-5.1 | frontier | low | medium | high | xhigh |
| gpt-5-pro | frontier | low | medium | high | xhigh |
| gpt-5 | frontier | low | medium | high | xhigh |
| o3-pro | frontier | low | medium | high | xhigh |
| o3 | frontier | low | medium | high | xhigh |
| gpt-5.4-mini | compact | low | low | medium | high |
| gpt-5.4-nano | compact | low | low | medium | high |
| gpt-5.3-codex-spark | compact | low | low | medium | high |
| gpt-5-mini | compact | low | low | medium | high |
| gpt-5-nano | compact | low | low | medium | high |

- **frontier**：新しい上位系列とPro系。Very Highでも`max`を自動選択せず`xhigh`に留め、未測定の待ち時間・利用枠消費を避けます。必要なら`manualOverride: "max"`で明示できます。
- **compact**：mini / nano / spark系。通常の編集で上位思考量を使いすぎないよう、`high`を上限にします。カタログが`xhigh`や`max`に対応していても、この表では自動選択しません。

**ヒューリスティック行の根拠は、モデル名・カタログ上のfamily・公開されている位置付けだけです。** 個別の思考量別成功率、難易度別の最適値、実利用での費用対効果を測定したものではありません。また、GPT-6.2 Sol／AstraについてはArtificial Analysis等で思考量別の集計値が公開されていますが、4難易度の課題層別sweepではないため、集計Indexから難易度別の最適値を逆算していません。VulcanBenchの確認した最新一覧にもGPT-6.2の行はありませんでした。

## API modelIDとサービス階層

ポリシーはカタログの表示名ではなく、API `modelID`で引きます。2026-11-18に実行中OpenCodeのカタログAPI（`GET /api/model`）で確認したところ、Fast／Flex／Pro／Ultrafastは独立したAPIモデルではなく、同じ`modelID`を共有するカタログ別名でした。

| カタログ表示 | API modelID |
|---|---|
| gpt-6.2-sol / -fast / -pro / -ultrafast | gpt-6.2-sol |
| gpt-6.2-astra / -fast / -pro / -ultrafast | gpt-6.2-astra |
| gpt-6.1-terra / -fast / -flex / -pro | gpt-6.1-terra |
| gpt-6.1-sol / -fast / -flex / -pro / -ultrafast | gpt-6.1-sol |
| gpt-5.6 / -fast / -pro | gpt-5.6 |
| gpt-5.6-sol / -fast / -flex / -pro | gpt-5.6-sol |
| gpt-5.5 / -fast / -flex | gpt-5.5 |
| gpt-5.5-pro | gpt-5.5-pro（独立ID） |
| gpt-daybreak-blue-latest | gpt-daybreak-blue-latest（独立ID） |
| gpt-daybreak-red-latest | gpt-daybreak-red-latest（独立ID） |

`gpt-5.6`は`gpt-5.6-sol`へ、Daybreakは別モデルへ自動で読み替えません。`-fast`等の末尾を削って推測することもしません。カタログAPIが返す`modelID`がそのまま対応表のキーです。速度・利用枠・課金条件が同じという意味ではありません。

## 採用した公開測定

参照日：2026-11-09。独立評価VulcanBench Frontier v4の一次報告です。各モデル23課題×5思考量（GPT-5.5のみ4思考量）、各組合せ1回。順序はlow / medium / high / xhigh / max。

| モデル・一次報告 | 実行・公開条件 | 完全合格課題数 | 複合スコア |
|---|---|---|---|
| [6.1 Sol](https://vulcanbench.com/benchmarks/swe-v4-gpt61-sol-v318.html) | 9/29–30実行、10/1公開、Codex CLI 0.159.0、品質protocol v3.18 | 20 / 22 / 23 / 23 / 23 | 86.22 / 86.44 / 88.23 / 88.78 / 88.35 |
| [6.1 Terra](https://vulcanbench.com/benchmarks/swe-v4-gpt61-terra-v329.html) | 10/27実行、10/30公開、Codex CLI 0.159.0、v3.29 | 13 / 12 / 15 / 16 / 23 | 74.95 / 80.10 / 79.19 / 83.68 / 90.00 |
| [6 Luna](https://vulcanbench.com/benchmarks/swe-v4-gpt6-luna-v316.html) | 9/25–28実行、9/28公開、Codex CLI 0.155.0、v3.16 | 0 / 0 / 2 / 11 / 12 | xhigh 71.94、max 67.26（timeoutを0点として集計） |
| [6 Astra](https://vulcanbench.com/benchmarks/swe-v4-astra-fable51-v34.html) | 9月の既存sweepを再採点、9/9公開、v3.4 | 22 / 23 / 23 / 23 / 23（Terra報告の比較表） | 87.43 / 87.73 / 88.16 / 89.16 / 89.30 |
| [6 Sol](https://vulcanbench.com/benchmarks/swe-v4-gpt6-sol-v317.html) | 9/28–29実行、9/30公開、Codex CLI 0.155.0、v3.17 | 4 / 13 / 15 / 18 / 19 | 67.62 / 80.60 / 82.83 / 85.94 / 86.82 |
| [5.6 Sol](https://vulcanbench.com/benchmarks/swe-v4-sol-v37.html) | 9/17–18実行、9/19公開、Codex CLI、v3.7 | 6 / 12 / 20 / 21 / 22（全実行） | 69.05 / 82.56 / 85.76 / 86.47 / 87.18 |
| [5.6 Terra](https://vulcanbench.com/benchmarks/swe-v4-terra-v36.html) | 9/17公開、Codex CLI、v3.6 + v3.6.1補完 | 2 / 5 / 11 / 14 / 23 | 59.70 / 66.35 / 76.68 / 83.46 / 89.05 |
| [5.6 Luna](https://vulcanbench.com/benchmarks/swe-v4-gpt55-luna-v35.html) | 9/15公開、Codex CLI、v3.5、115実行 | 0 / 1 / 9 / 13 / 19 | 41.29 / 53.28 / 71.22 / 79.11 / 84.15 |
| [5.5](https://vulcanbench.com/benchmarks/swe-v4-gpt55-luna-v35.html) | 9/15公開、Codex CLI、v3.5、92実行 | 1 / 3 / 7 / 11 / 非対応 | 49.80 / 63.54 / 69.92 / 78.46 / 非対応 |

6 Solのmediumは採点不能1件があり複合スコアは22/23件、合格数・時間・費用は全23件。5.6 Solのmaxも採点不能1件があり複合スコアは22件、その範囲では21/22合格ですが、採点不能だった実行もテストは合格しているので全実行では22/23です。5.6 Terraのmax 1件は利用枠の都合で別ChatGPTアカウントによる同一harness・同一CLIの補完実行です。

### 当初の判断（r1履歴、現行のr2では一部変更）

以下はVulcanBench中心だったr1の判断履歴です。**6.1 Solの最難high、6 Lunaの自動xhigh上限、5.6 TerraのHigh=maxは撤回**し、冒頭表と[再検討記録](MULTI-BENCHMARK-REVIEW.md)へ更新しています。単一評価の費用逆転やtimeout傾向を一般化しません。

- **Astra**：lowでも22/23だが「すべてlow」とはしません。難しい課題にはmedium、最難には品質スコア上昇の見られるxhighを残します。平均時間はlow 4.2分、medium 3.8分、high 4.9分、xhigh 8.1分、max 10.3分。maxを自動既定にするほどの差とは採用しません。
- **6.1 Sol**：high以上で完全合格数が同じため最難もhighを採用。複合品質はxhighがわずかに高く、highで十分という保証はありません。mediumよりhighの推定費用が低い測定もあり、思考量・費用は単調とは限りません。
- **6.1 Terra**：maxで23/23に達する差を考慮し、最難にmax、Highにxhighを採用。low/mediumの逆転もあり、全課題で増量が有効とは断定しません。
- **6 Luna**：高難度の開発課題ではlow/mediumの結果が弱いためLowからhighに引き上げます。ただしVery Lowの小修正はこの測定の対象外なのでlowを維持。xhighは2件、maxは4件が3時間timeoutとなり、timeout込みの複合スコアはmaxで下がるため自動既定はxhighまでとします。手動maxは可能です。
- **6 Sol**：low→mediumで4→13合格、High相当では測定上highより安価・短時間で18件合格したxhighを採用します（highは15件）。最難は19件合格のmax。ただしxhighとmaxの複合スコア差は1標準誤差内であり、maxが有意に優れると証明されたわけではありません。時間は13.0 / 17.5 / 23.8 / 20.9 / 24.5分、API換算費用は$1.02 / $1.76 / $2.33 / $2.00 / $2.52です。
- **5.6 Sol**：low→mediumの大きな改善をLowに反映し、Highにはhighより速く安価だったxhigh（21件合格）、最難にはmax（全実行で22件合格）を採用。対応表は6 Solと同じですが別の実測に基づきます。時間は9.8 / 11.1 / 12.0 / 10.6 / 11.6分、API換算費用は$1.36 / $1.72 / $2.05 / $1.61 / $1.77。上位3思考量の差は小さく、maxの品質採点は1件欠けています。
- **5.6 Terra**：low/mediumで2/5件に対してhighで11件のためLowにhighを採用。High以上には23件合格のmaxを採用します。xhighは14件合格・19.2分・$2.12、maxは23件・19.7分・$1.88で、この測定ではmaxがほぼ同じ時間で安価だったため、Highの既定にxhighを残しません。maxより安いhighをLowの選択肢として残します。
- **5.6 Luna**：low/mediumでは0/1件なのでLowからhigh（9件）、Highにはxhigh（13件）。最難はmax（19件）を採用。6 Lunaのtimeout傾向をこのモデルへ流用しません。時間は2.7 / 7.4 / 21.0 / 25.4 / 44.1分、API換算費用は$0.02 / $0.07 / $0.22 / $0.27 / $0.45で、maxには大きな待ち時間の代償があります。
- **5.5**：low/mediumで1/3件、highで7件、xhighで11件と改善したためLowをhigh、High以上をxhighにします。maxは非対応で要求しません。時間は8.2 / 12.4 / 18.2 / 20.8分、API換算費用は$1.79 / $2.71 / $4.20 / $4.56。xhighでもこの難しい課題群の過半は未合格なので、思考量調整だけで能力不足を解消するものではありません。

全系列のVery Lowは小規模な文字修正等を想定してlowを維持します。**この課題群は4難易度別に層別化されておらず、特にVery LowやLowの選択は測定結果そのものではなく設計上の推定です。** 高思考量が測定上安い場合も、この小規模な1回の結果が日常利用やサブスク消費で再現する保証はありません。

### 限界

これは23個のlegacy binary再構築課題で、一般的な開発作業や4難易度ラベルを網羅しません。単回試験、課題の偏り、世代・CLI・品質protocolの違いがあり、表を厳密なモデル間ランキングとして扱えません。品質評価は一部LLM採点で、人間による品質保証ではありません。複合スコアは機能50%、lint/complexity 8.5%、security 8.5%、Code quality 33%です。

課金値はAPI換算推定で、実際のサブスク請求ではありません。Lunaのtimeout分の費用は欠落しており総費用には使えません。OpenCodeとCodexのharnessは異なります。r2では複数の独立評価を比較しましたが、節約・精度・開発品質の改善を本プラグインで実測したものではありません。

**ヒューリスティック23系列には、そもそもこの種の思考量別測定がありません。** クラス分けは公開情報とカタログ上の位置付けによる設計判断で、最適性・費用・待ち時間を保証しません。新しい一次評価が公開された場合は、測定行へ昇格させるか表を改訂してください。

## 互換性・制御

- `modelPolicy: "benchmark"`では、測定9系列とヒューリスティック23系列の両方を使います。`"common"`で従来の共通表へ戻せます。
- 状態の`policy`は、測定行が`benchmark-2026-11-09-r2:<modelID>`、ヒューリスティック行が`heuristic-2026-11-18:<modelID>`、未知IDが`common:no-model-evidence`です。
- `maxEffort`の既定は`xhigh`から`max`へ変更済みです。ヒューリスティック行は`max`を自動選択しませんが、`manualOverride`や`minEffort`/`maxEffort`の設定は通常どおり適用されます。
- ポリシー適用後に、実カタログの対応思考量とmin/maxを適用します。範囲内で切り上げ、なければ範囲内の最大対応値。例：max非対応ならxhigh、Pro系でlow要求ならmediumへ。範囲内の対応値がなければ変更しません。
- `none`は自動選択・プラグイン設定の対象外。明示variantや既存request overrideの`none`は保持します。既存`minimal`対応は維持します。
- 手動指定、明示variant、既存request override、非OpenAI除外、失敗時の元設定保持の優先順位は変更しません。
- 難易度のキャッシュは開発モデルと独立。モデル変更時は同じ難易度から表を再適用し、キャッシュだけを理由に追加判定しません。
- `requestedEffort`は制約適用前、`effort`は適用後。どちらも最終HTTP送信値の観測ではありません。
