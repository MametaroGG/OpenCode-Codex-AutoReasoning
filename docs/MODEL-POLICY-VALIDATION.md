# モデル別ポリシー変更の検証（2026-11-09）

複数ベンチマーク比較によるr2適用後、下記の全コマンドを再実行して成功しました。98件のテストには全9系列の更新後の表が含まれます。6.1 Solのモデル変更／キャッシュ再利用テストも新しいxhigh要求値へ更新しました。状態のポリシー版は`benchmark-2026-11-09-r2`です。[比較・修正理由](MULTI-BENCHMARK-REVIEW.md)を参照してください。

v0.2.0に含む変更に対するローカル・オフライン検証です。公開済みv0.1.0のタグ・配布物は変更していません。

| 検証 | 結果 |
|---|---|
| npm run typecheck | 成功 |
| npm test | 98件成功、失敗なし |
| npm run build | verify:package内で実行、成功 |
| npm run benchmark | 成功。固定応答の検証・キャッシュ・保持上限のみ |
| npm run verify:package | オフラインで実tarballをインストールし、モックホスト検証成功 |
| git diff --check | 成功 |

v0.2.0公開前にも全検証を再実行して成功。npm auditはmoderate 24件、high/criticalなし。新しい依存の追加・更新は行っていません。

追加した検証：9個別表の全難易度、未知IDの共通fallback、common選択、設定検証、maxのカタログ確認、旧xhigh上限、非対応maxの代替、min制約、Fastの実API modelID解決とモデル保持、モデル変更時のキャッシュ再利用、手動max、明示none variant・request override保持、状態の推奨値／制約後値の表示。

全9系列それぞれについて、通常／FastのカタログID×4難易度（計72組合せ）を実際のcontext hookコールバックで検証しています。5.5はmaxなしのカタログを使い、非対応maxを要求しないことを確認。通常→Fast変更で同じ難易度のキャッシュを再利用します。開発用6 Lunaが判定用Lunaと同じカタログ項目になる場合も含めています。これはモックによる配線検証で、実送信や分類精度の測定ではありません。

従来の非OpenAI除外・判定失敗時の保持・明示variant・既存override・cleanup等の回帰テストも成功しています。依存関係のdeprecated警告は継続しています。

**実モデル呼び出しは0回**です。以前のLuna/Sol実ホスト記録は旧共通表の検証であり、新しい表・max送信・モデル別品質・節約の検証ではありません。今回の98件はLuna分類精度や推奨表の最適性の証拠ではありません。Desktop/native TUI描画も未検証です。

対応表と公開測定の出典・限界は[MODEL-POLICIES.md](MODEL-POLICIES.md)を参照してください。
