# 複数ベンチマークによる再検討（2026-11-09 r2、2026-11-18 r2）

> [!NOTE]
> この文書は、複数評価を比較した2回のレビューを扱います。2026-11-09のr2は既存9系列、2026-11-18のr2は新規対応モデルのうち異なる課題群の思考量別sweepを2つ以上確認できた5系列です（6.2は同一評価元の別課題群を含む）。2026-11-18のr1に残る7系列（GPT-5.4 nano、GPT-5.3 Codex、GPT-5.1、GPT-5、GPT-5 mini／nano、o3）は思考量別sweepが1つだけ、Cyber／Daybreak／Pro系／GPT-5.6など11系列はsweep自体がないため、それぞれ単一ソース／未測定として区別します。[MODEL-POLICIES.md](MODEL-POLICIES.md)で明確に区別しています。

## 2026-11-18の追加レビュー（新規5系列）

新たにカタログ対応した12系列を、既存r2と同じ基準（複数の思考量別sweepを比較し、平均・多数決をせず、coding／agenticの個別結果を重視する）で再検討しました。**5系列を`benchmark-2026-11-18-r2`へ昇格します。そのうち4系列はプロファイルを維持し、GPT-6.2 SolだけVery Highをxhigh→maxへ修正**します。残る7系列は思考量別sweepが1つだけのため`benchmark-2026-11-18-r1`に残します。

| モデル | Very Low | Low | High | Very High | r1からの変更 | 確認した思考量別sweep |
|---|---|---|---|---|---|---|
| 6.2 Sol | low | medium | high | max | Very High: xhigh→max | AA Terminal-Bench 4.0／FrontierCode-AA 2.0 |
| 6.2 Astra | low | medium | high | xhigh | 維持 | 同上 |
| 5.4 | low | low | medium | xhigh | 維持 | LiveBench／OckBench（DeepSWEはxhigh単点） |
| 5.4 mini | low | medium | high | xhigh | 維持 | LiveBench／Cognition FrontierCode 1.1 |
| 5.2 | low | medium | high | high | 維持 | LiveBench／OckBench-Math v2 |

### 思考量別スコア

順序はlow / medium / high / xhigh / max。`—`はその水準の行がないことを示し、0点ではありません。AAは2026-11-18参照の比較ページ、Cognitionは公開JSON、LiveBenchは2026-01-08の生のOverall、OckBenchはv3 Overall（5.2はv2のMath 100問）です。

| モデル | 評価 | low / medium / high / xhigh / max |
|---|---|---|
| 6.2 Sol | AA Terminal-Bench 4.0 | 37.9 / 56.1 / 58.6 / 56.1 / 60.1 |
| 6.2 Astra | AA Terminal-Bench 4.0 | 51.0 / 58.6 / 60.1 / 64.1 / 64.1 |
| 6.2 Sol | AA FrontierCode-AA 2.0 | 31.4 / 41.4 / 40.2 / 42.8 / 44.4 |
| 6.2 Astra | AA FrontierCode-AA 2.0 | 32.7 / 46.6 / 47.1 / 49.0 / 45.4 |
| 6.2 Sol | AA Intelligence Index v5.0.1 | 41 / 53 / 55 / 56 / 57 |
| 6.2 Astra | AA Intelligence Index v5.0.1 | 46 / 57 / 60 / 62 / 62 |
| 6.2 Sol | Cognition FrontierCode 2.0（補強） | 36.6 / 42.2 / 43.9 / 43.9 / 48.2 |
| 6.2 Astra | Cognition FrontierCode 2.0（補強） | 42.2 / 46.5 / 47.7 / 48.5 / 48.2 |
| 5.4 | LiveBench Overall | — / — / 75.07 / 80.28 / — |
| 5.4 | OckBench Overall | 78.0 / 82.0 / 80.5 / — / — |
| 5.4 | DeepSWE Pass@1（単点） | — / — / — / 51.77 / — |
| 5.4 mini | LiveBench Overall | 49.54 / 58.33 / 63.57 / 67.54 / — |
| 5.4 mini | Cognition FrontierCode 1.1 | 10.6 / 23.7 / 26.3 / 30.8 / — |
| 5.2 | LiveBench Overall | 65.33 / 71.84 / 74.84 / — / — |
| 5.2 | OckBench-Math v2 | 41.5 / 63.0 / 66.0 / — / — |

AAの2026-11-18比較ページは[6.2 Sol対Astra](https://artificialanalysis.ai/models/releases/comparisons/gpt-6-2-sol-vs-gpt-6-2-astra)。CognitionのFrontierCode 2.0は[公開JSON](https://cognition.com/data/frontier-code-2.0/data.json)、FrontierCode 1.1は[公開JSON](https://cognition.com/data/frontier-code-1.1/data.json)。OckBenchは[リーダーボード](https://ockbench.github.io/)と[論文v2のMath表](https://arxiv.org/html/2511.05722v2)を参照しました。

### 5系列それぞれの判断

1. **6.2 Sol：Very Highをxhighからmaxへ。** AAの2課題群はどちらも最上位でmaxがxhighを上回ります（Terminal-Bench 60.1%対56.1%、FrontierCode 44.4%対42.8%）。CognitionのFrontierCode 2.0もmax 48.2%対xhigh 43.9%で同方向ですが、同じFrontierCode系で課題が重複し得るため、独立した2つ目として数えず補強にとどめます。Highはhighのままです（Terminal-Benchはhigh 58.6%がxhigh 56.1%より上、FrontierCodeはhigh 40.2%がxhigh 42.8%より下で一致しない）。maxはTime per Task 7.9分・$1.01でxhighの4.9分・$0.65より重いため、最難のVery Highだけに限定します。
2. **6.2 Astra：維持。** xhighはTerminal-Bench 64.1%（maxと同点）、Index 62（maxと同点）、FrontierCode 49.0%（max 45.4%より上）。maxは11.5分・$4.00でxhighの6.5分・$2.52より重く、一貫した改善がありません。High=highも3評価でhigh>mediumです。
3. **5.4：維持。** OckBenchはlow 78.0、medium 82.0、high 80.5でmediumが最高、highは下がります。LiveBenchはhigh 75.07→xhigh 80.28、Agentic Coding 46.7→70.0。DeepSWEはxhigh 51.77の単点だけで曲線を確認できないため、sweepの裏付けには数えません。Low=low（OckBenchのlowが既に高い）、High=medium（OckBenchのpeak）、Very High=xhigh（LiveBenchの跳ね）を維持します。
4. **5.4 mini：維持。** LiveBench 49.54 / 58.33 / 63.57 / 67.54とCognition FrontierCode 1.1 10.6 / 23.7 / 26.3 / 30.8がともに単調に改善し、xhighが両方で最高です。
5. **5.2：維持。** LiveBench 65.33 / 71.84 / 74.84とOckBench-Math v2 41.5 / 63.0 / 66.0がともにhighまで単調です。どちらにもxhigh行がないため、Very Highは測定済みの最高値であるhighに留めます。

### 思考量別sweepが1つだけの7系列（r1のまま）

| モデル | 確認できた思考量別sweep | 2つ目として数えなかったもの |
|---|---|---|
| 5.4 nano | LiveBench（low→xhigh） | AA IndexはN/A |
| 5.3 Codex | LiveBench（high／xhigh） | なし |
| 5.1 | LiveBench（low／medium／high） | なし |
| 5 | LiveBench（minimal／low／high） | なし |
| 5 mini | LiveBench（minimal／low／high） | OckBench-Math highの単点 |
| 5 nano | LiveBench（low／high） | なし |
| o3 | LiveBench（medium／high） | なし |

単点や2水準だけの結果は曲線の形を確認できないため、2つ目のsweepとして数えません。**7系列は「測定済みの最適値」ではなく、単一ソースの曲線をanchorにした暫定ポリシー**として`benchmark-2026-11-18-r1`のまま残します。

### このレビューの限界

- AAの2課題群は同一評価元です。09 r2でも独立したcoding評価として扱いましたが、評価元の独立性としては1社です。CognitionのFrontierCodeは同じ課題系を含み得るため、独立した2社目には数えていません。
- LiveBench Overallは分野横断の編集的な総合値、OckBenchは200問、OckBench-Math v2は100問、FrontierCodeはCognitionのharness、AAは同社のharnessです。点数を平均・換算していません。
- 4つのローカル難易度ラベルで層別したデータはなく、Very Low=lowと下位2段の一部は設計判断です。5.4のLow=low、5.2のVery High=highなど、測定外の割当を含みます。
- このプラグインの実環境で品質・節約・待機時間の改善を再測定したものではありません。

## 2026-11-09のr2レビュー（既存9系列）

### 結論と変更範囲

VulcanBenchだけでは裏付けが弱かったため、独立した評価元・異なる課題群を比較しました。**3セルを修正し、6系列は維持**します。実装は`benchmark-2026-11-09-r2:<modelID>`で区別し、v0.2.0 Pre-releaseに含めます。公開済みv0.1.0は変更しません。

| モデル | Very Low | Low | High | Very High | r1からの変更 |
|---|---|---|---|---|---|
| 6.1 Sol | low | medium | high | xhigh | Very High: high→xhigh |
| 6.1 Terra | low | high | xhigh | max | 維持 |
| 6 Astra | low | low | medium | xhigh | 維持 |
| 6 Sol | low | medium | xhigh | max | 維持 |
| 6 Luna | low | high | xhigh | max | Very High: xhigh→max |
| 5.6 Sol | low | medium | xhigh | max | 維持 |
| 5.6 Terra | low | high | xhigh | max | High: max→xhigh |
| 5.6 Luna | low | high | xhigh | max | 維持 |
| 5.5 | low | high | xhigh | xhigh | 維持 |

これは**開発用の品質・時間・使用量の折衷方針**です。各評価の点数を平均して作った表でも、4難易度ごとに最適性を実証した表でもありません。難しい課題では品質向上に余地を残し、通常課題では上位思考量の追加費用を抑えます。ある思考量を飛ばすことは、その思考量が劣るという主張ではありません。

### 評価元、条件、独立性

いずれも2026-11-09参照。外部モデルへの追加推論要求なし。検索結果の転載だけで確定せず、以下の一次ページ・公開データを確認しました。

| 評価 | 対象・条件 | 今回の位置付け |
|---|---|---|
| [VulcanBench Frontier v4](MODEL-POLICIES.md#採用した公開測定) | 23件のlegacy再構築、各設定1回、Codex、機能テスト＋一部LLM品質採点 | 既存の根拠。小標本・harness依存 |
| [Datacurve DeepSWE v1.1](https://deepswe.datacurve.ai/)・[公開JSON](https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json) | 113課題・91repo・5言語、mini-swe-agent、4巡、設定あたり約448–452採点実行。JSON生成日時2026-09-22 | 独立した長期SWE課題。Astra／5.6各系列／5.5の思考量比較 |
| [Artificial Analysis v5.0.1の方法](https://artificialanalysis.ai/methodology/intelligence-benchmarking) | Terminal-Bench 4.0: 66課題×3回、mini-swe-agent。FrontierCode 2.0: 132課題×3回、Stirrup＋テスト・rubric。総合Indexは他分野も含む | 6.1 Sol／Terra／6 Luna／Astraの主な追加根拠。開発用判断では総合順位より個別coding成績を重視 |
| [Hex DataBench v1.1](https://hex.tech/databench)・[方法の紹介](https://hex.tech/blog/databench-agentic-analytics-benchmark) | 100分析課題、Hexのwarehouse環境、rubric/LLM採点。結果ページ更新10/7、9/17に判定較正変更 | 開発とは別分野で、思考量増加が常に有利ではないことを確認。旧v1の点数と混ぜない |
| [ARC Prize、5.6 Terra](https://arcprize.org/results/openai-gpt-5-6-terra) | VerifiedのARC-AGI-1/2/3、抽象推論・探索。各ベンチの設定は別 | Terraの増量効果の補助確認。コード開発へ直接換算しない |
| [Sonarの5.6 Sol／Terra評価](https://www.sonarsource.com/blog/openai-gpt-5-6-sol-and-terra/) | 8/6公開、4,444 Java課題、5.5含む全モデルmedium固定、テストと静的解析 | 品質・安全性と合格率の違いを確認。思考量sweepではないためhigh/maxへの引上げ根拠にしない |
| [Paddoの実作業ケーススタディ](https://paddo.dev/blog/default-was-right) | 9/29、1つのTypeScript monorepoの6変更、各モデル各思考量20実行 | 6 Solの反証・適用範囲の注意。300実行は3モデル合計、独立300課題ではない。主要な割当根拠にはしない |

Artificial Analysisの[7/9の5.6記事](https://artificialanalysis.ai/articles/gpt-5-6-has-landed)も参照しましたが、そのCoding Agent IndexにはDeepSWEが含まれます。**同じ課題の再掲を独立した裏付けとして二重計上しません。** 当時のIndex v4.1と現在のv5.0.1の総合点も比較しません。

LiveBenchも調査しましたが、取得した一次ページでは必要な思考量別全行を確認できませんでした。転載サイトの重み付きAgent Fitを独立実測と扱わず、今回の数値判断から除外しました。OpenAI発表のDeepSWE結果も、Datacurveのmini-swe-agent実測と混同しません。

### 追加根拠1：Artificial Analysisの個別開発課題

一次表：[6.1 Sol対Astra](https://artificialanalysis.ai/models/releases/comparisons/gpt-6-1-sol-vs-gpt-6-astra)、[6.1 Terra対6 Luna](https://artificialanalysis.ai/models/releases/comparisons/gpt-6-1-terra-vs-gpt-6-luna)。low / medium / high / xhigh / max順、成功率%。比較ページの取得時値で、恒久的に固定されたスコアではありません。

| モデル | Terminal-Bench 4.0 | FrontierCode 2.0 |
|---|---|---|
| 6.1 Sol | 30.8 / 48.0 / 51.5 / 54.0 / 56.1 | 20.2 / 33.4 / 36.7 / 38.5 / 40.6 |
| 6.1 Terra | 15.2 / 32.3 / 41.9 / 46.5 / 55.6 | 24.5 / 34.5 / 37.5 / 36.9 / 42.3 |
| 6 Luna | 0.0 / 2.5 / 4.5 / 8.1 / 12.6 | 2.2 / 12.8 / 18.6 / 18.4 / 25.2 |
| 6 Astra | 41.9 / 49.5 / 54.0 / 59.6 / 59.1 | 26.2 / 36.6 / 40.1 / 41.4 / 42.4 |

6.1 SolのIndex全体の費用/課題はhigh $0.59、xhigh $0.76、max $1.27。6 Lunaはxhigh $0.10、max $0.15。**これは個別coding評価の費用ではなく、9評価の重み付き費用**です。個別成功率と割って「1成功あたり費用」を作ってはいけません。

同ページのTime per Taskは主に出力トークン数と計測された出力速度からの計算値で、OpenCodeの実作業の総所要時間ではありません。速度は直近5日等で更新されるため、費用・時間とも参照時のスナップショットとして扱います。

### 追加根拠2：Datacurve DeepSWEの思考量sweep

公開JSONの`pass_at_1`を%へ変換し、小数2桁へ丸めました。順序はlow / medium / high / xhigh / max。API費用はJSONの未再価格計算値です（サイト表示は現行価格へ補正する場合があるので一致しないことがあります）。古い費用で現在のサブスク消費や請求額は予測しません。

| モデル | Pass@1 (%) | JSON費用/採点実行 (USD) |
|---|---|---|
| 6 Astra | 67.04 / 72.79 / 73.23 / 74.12 / 73.23 | 1.595 / 3.075 / 3.924 / 4.429 / 7.498 |
| 5.6 Sol | 45.35 / 61.06 / 69.40 / 70.73 / 72.67 | 1.074 / 1.862 / 3.470 / 4.704 / 8.386 |
| 5.6 Terra | 24.05 / 35.11 / 53.76 / 60.18 / 69.62 | 0.428 / 0.583 / 1.134 / 2.127 / 4.946 |
| 5.6 Luna | 1.55 / 11.28 / 44.25 / 56.86 / 67.19 | 0.072 / 0.216 / 0.778 / 1.536 / 3.028 |
| 5.5 | 26.99 / 53.98 / 64.38 / 67.04 / 非対応 | 1.200 / 2.749 / 5.100 / 7.226 / 非対応 |

4回は同じ113課題の反復で、452個の独立課題ではありません。例えばAstraのmedium/high/xhighの公表95%区間は約±2.59/3.42/2.87ポイントで差より大きく、順位だけで有意な優越とは言えません。timeoutとcontext失敗は不合格、provider/verifier/networkエラーは除外。VulcanBenchとはエラー処理もharnessも違います。JSONに6.1 Sol／Terra、6 Sol／Lunaの全思考量データはないので推測しません。

### 追加根拠3：Hexでの反証

DataBench v1.1の成功率%、同じ思考量順。表にないmaxは未掲載であり0点ではありません。

| モデル | low / medium / high / xhigh / max |
|---|---|
| 6 Astra | 55.0 / 52.7 / 52.0 / 52.3 / 55.0 |
| 6.1 Sol | 48.0 / 58.0 / 55.0 / 55.0 / 57.0 |
| 6 Sol | 50.3 / 51.3 / 54.7 / 61.3 / 57.0 |
| 6 Luna | 30.3 / 42.7 / 46.0 / 46.0 / 52.3 |
| 5.6 Sol | 29.7 / 39.7 / 38.0 / 40.3 / 未掲載 |
| 5.6 Terra | 27.0 / 29.3 / 32.7 / 39.3 / 未掲載 |
| 5.6 Luna | 19.0 / 24.0 / 31.3 / 35.3 / 未掲載 |

6.1 Terraと5.5はこの取得表にないため、結果を補いません。解析はコード修正とは違う仕事なので、Hexだけで開発向けのmaxを全廃する判断もしません。v1紹介記事の「全モデル50%以上」という記述はv1.1への較正変更前で、現在表とは混ぜません。

### 9系列それぞれの判断

1. **6.1 Sol：Very Highをxhighへ修正。** VulcanBenchの23/23の飽和を、一般の開発課題でhigh以上が不要な証拠にしていた点を訂正。AAの両coding評価ではhigh→xhigh→maxと改善するため上位設定を残します。一方、maxはxhighよりIndex全体費用が約67%増え、両coding成績は各2.1ポイント増。Hexはmediumが最高。最難の既定をxhighとする折衷であり、maxが無価値という判断ではありません。
2. **6.1 Terra：維持。** AAでもTerminal-Benchのxhigh→maxが46.5→55.6%、FrontierCodeは36.9→42.3%で、最難maxを複数課題群が支持。Low=highは難しめの開発課題への品質寄りの設計であり、mediumが日常作業で不十分という実証ではありません。
3. **Astra：維持。** DeepSWEはmedium 72.79%、high 73.23%、xhigh 74.12%と近く、High難易度にはmediumで使用量を抑え、最難にはAAのTerminal-Benchでも最高値だったxhighを選びます。lowはDeepSWEでmediumより低く、「全部low」にはしません。Hexではlowが高く、低思考量の選択肢を残すこととも整合。AAではhighにも改善があり、**highが劣る・公式が非推奨という意味での省略ではありません。** 全候補を4ラベルに入れない折衷として妥当です。
4. **6 Sol：維持、ただし適用範囲を限定。** VulcanBenchでは上位思考量で改善。Hexではxhighがmaxより4.3ポイント上で、maxは約1.69倍の費用。Paddoの小規模実作業でもlow/mediumが各9/20、xhigh 6/20、max 7/20のclean runで増量は改善を保証しません。日常はlow/medium、Highはxhigh、最難のみmaxという設計は維持できますが、「増量すれば必ず安全・正確」は否定します。
5. **6 Luna：Very Highをmaxへ修正。** AAはxhigh→maxでTerminal-Bench 8.1→12.6%、FrontierCode 18.4→25.2%。Hexも46.0→52.3%。VulcanBenchのmaxで3時間timeoutが4/23（xhigh 2/23）だった反証を残したまま、異なる2評価元での改善を考慮して最難だけmaxを許可します。timeoutリスクが解消されたという意味ではなく、待ち時間重視ならmaxEffort=xhighで制限可能です。
6. **5.6 Sol：維持。** DeepSWEでもmediumまでの大幅改善と、上位での小幅改善を確認。xhighはhighより約1.3ポイント上、maxはさらに約1.9ポイント上で費用は増えるため、単純な費用優越とは言いません。Hexでもmediumとxhighは近い。難しい開発課題の品質寄りとしてHigh=xhigh・最難=maxは維持しますが、日常作業のhighを飛ばす唯一の解ではありません。
7. **5.6 Terra：Highをxhighへ修正。** DeepSWEはxhigh 60.18%・$2.127、max 69.62%・$4.946で、maxは約2.33倍。VulcanBenchでmaxの方が安かった単回結果を一般化できません。Highにはxhigh、最難だけmaxに変更。ARC-AGI-2でもhigh/xhigh/maxが67.1/74.2/83.9%と改善するので、maxを消す必要はありません。なおARCページの説明文には数値表と整合しにくい表現があり、解釈はVerified scores表に限定します。
8. **5.6 Luna：維持。** DeepSWEでhigh 44.25→xhigh 56.86→max 67.19%と改善。low/mediumとの差が大きく、Lowからhigh、最難maxの品質寄り方針を支持。ただしmaxの費用・時間も増えるので、通常作業へ一律maxを適用しません。
9. **5.5：維持。** DeepSWEはhigh 64.38%、xhigh 67.04%で、VulcanBenchと同じ方向。最難xhigh、max非対応は維持。Sonarではmediumでも78.66%のJava課題が合格しており、難しいSWE課題の低得点から「mediumでは何もできない」と一般化しません。Low=highも品質寄りの暫定選択です。

### 残る限界

- ベンチマーク点数は異なる課題・分母・harness・判定方法を持つため、平均や多数決で最適値を決めていません。共通課題の重複にも注意しています。
- 4難易度ラベルで層別化された、9モデル全体の品質・費用データはありません。難易度分類の誤りや分野差も残ります。Very Low=lowの全モデル共通維持も設計判断です。
- SonarでSolはmediumの機能合格率が5.5より高い一方、静的解析のbug/vulnerability密度は高くなっています。思考量・合格率を安全性の代用にしません。
- サブスク請求・使用枠の実消費、OpenCode実環境の品質・節約・timeout率は未測定。独立評価を確認したことと、このプラグインで同じ改善を再現したことは別です。
- すべての割当の最適性・統計的優越を主張しません。r2は確認できた反証を踏まえた限定的な修正です。将来の版更新で再検討します。
