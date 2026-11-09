<div align="center">

# OpenCode Codex Auto Reasoning

**モデルはそのまま。思考量は、タスクに合わせて。**

GPT-6 Lunaが指示の難易度を判定し、OpenAIモデルのreasoning effortを自動調整するOpenCode V2プラグイン。

[![Preview v0.2.0](https://img.shields.io/badge/preview-v0.2.0-a78bfa?style=flat-square)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/tag/v0.2.0)
[![CI](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-18181b?style=flat-square)](https://opencode.ai/)
[![Node.js 22+](https://img.shields.io/badge/Node.js-%3E%3D22-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[ダウンロード](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/tag/v0.2.0) · [クイックスタート](#quick-start) · [対応モデル](#models) · [設定](#configuration) · [不具合を報告](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/issues)

</div>

---

## 特長

- **タスクに合わせて自動調整** — 指示の難易度を4段階で判定し、送信直前に思考量を選択。
- **モデル別の選択ポリシー** — 全9系列と同じAPIモデルIDを持つFast版に対応。複数の公開ベンチマークを参考に設計。
- **モデル選択はユーザーのまま** — 開発モデルの自動切替や、セッションの既定設定の書換えは行いません。
- **ユーザー指定を尊重** — 明示variantや既存のリクエスト設定を保持。手動固定・上限設定も可能。
- **失敗時は変更しない** — 判定失敗・タイムアウト・未許可の場合は元の設定を保持。
- **必要な判定だけを実行** — 同一指示はキャッシュし、ツール継続での再判定を抑制。

> [!IMPORTANT]
> 現在は**Pre-release**です。判定の外部送信は初期状態で無効です。有効化には`allowModelRequests: true`が必要で、判定にも接続先の利用枠・料金が発生し得ます。

## 目次

- [クイックスタート](#quick-start)
  - [必要な環境](#requirements)
  - [インストール](#installation)
  - [OpenCodeへ登録](#setup)
- [使い方](#usage)
- [対応モデルと思考量](#models)
- [設定](#configuration)
- [状態確認](#status)
- [プライバシーと制限](#privacy)
- [検証状況](#validation)
- [開発・コントリビュート](#development)
- [ライセンス](#license)

<a id="quick-start"></a>
## クイックスタート

<a id="requirements"></a>
### 1. 必要な環境

| 項目 | 要件 |
|---|---|
| OpenCode | **V2**。SDK 2.2.6を対象に開発・検証。V1非対応 |
| Node.js | **22以上** |
| 判定用モデル | 接続済みの`openai/gpt-6-luna`または`opencode/gpt-6-luna` |
| 開発用モデル | `openai`プロバイダの、思考量設定が確認できるモデル |

本体はOpenCodeのサーバー側で動作します。**CLI/API経由の実機確認済み、Desktop版は未検証**です。状態表示UIはTUI用で、Desktop専用UIはありません。

<a id="installation"></a>
### 2. インストール

#### GitHub Releasesから（推奨）

[v0.2.0 Preview](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/tag/v0.2.0)から、次の2ファイルをダウンロードします。

- `opencode-auto-reasoning-0.2.0.tgz`
- `SHA256SUMS`

PowerShellでSHA-256を計算し、`SHA256SUMS`の値と一致することを確認してからインストールしてください。

```powershell
Get-FileHash ./opencode-auto-reasoning-0.2.0.tgz -Algorithm SHA256
npm install --prefix ./auto-reasoning-plugin ./opencode-auto-reasoning-0.2.0.tgz --ignore-scripts
```

プラグインの場所は`auto-reasoning-plugin/node_modules/opencode-auto-reasoning`です。設定にはこのフォルダの**絶対パス**を使います。

**npmレジストリには未公開です。** パッケージ名だけを指定するインストールは使わないでください。

<details>
<summary>ソースからビルドする場合</summary>

```sh
git clone https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning.git
cd OpenCode-Codex-AutoReasoning
npm ci
npm run build
```

設定の`package`には、ビルドしたリポジトリのフォルダの絶対パスを指定します。`main`にはリリース後の変更が含まれる場合があります。

</details>

<a id="setup"></a>
### 3. OpenCodeへ登録

利用先の`opencode.jsonc`の既存`plugins`配列へ、次の要素を追加します。**既存設定全体を置き換えないでください。**

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      // インストール先の絶対パスへ変更してください。
      "package": "C:/path/to/auto-reasoning-plugin/node_modules/opencode-auto-reasoning",
      "options": {
        "classifierModel": "openai/gpt-6-luna#low",
        // 入力送信・利用枠・料金・データ方針を確認後、trueに変更。
        "allowModelRequests": false
      }
    }
  ]
}
```

APIキーをこの設定へ書く必要はありません。OpenCodeで接続済みのプロバイダを使います。送信先・利用権・利用枠・料金を確認し、`allowModelRequests`を`true`にすると自動判定が有効になります。

全プロジェクトで使う場合は、同じ要素を`~/.config/opencode/opencode.jsonc`へ追加します。`XDG_CONFIG_HOME`を設定している場合はその配下です。プロジェクト側との二重登録は避けてください。端末用の`cli.json`への登録は不要です。

設定は通常、保存時に再読み込みされます。必要なら`/reload`を使い、**再読み込み後の新しい指示**から利用してください。

<a id="usage"></a>
## 使い方

1. OpenCodeで、使いたい**OpenAIの開発モデル**を選びます。
2. 思考量variantは指定せず、通常の`default`の状態にします。
3. 普段どおり作業を依頼します。
4. TUIの`/reasoning-status`で、難易度と選択した思考量を確認します。

```text
ユーザーの指示
    ↓
GPT-6 Lunaが難易度を判定
    ↓
選択中のモデルに対応するポリシーを適用
    ↓
カタログの対応思考量と設定のmin/maxを適用
    ↓
同じ開発モデルへ送信
```

`#high`などを明示した場合や、既存のリクエストに思考量設定がある場合は自動調整しません。通常の`default`は自動調整の対象ですが、カタログに実在する`default`というvariantは明示指定として保持します。

優先順位は**無効化 → 既存リクエスト設定の保持 → 手動固定 → 明示variantの保持 → 自動判定**です。手動固定にもモデルの対応範囲とmin/maxを適用します。

<a id="models"></a>
## 対応モデルと思考量

判定役は**GPT-6 Luna専用**、開発用の調整対象は**`openai`プロバイダのみ**です。対象外のプロバイダでは、判定呼び出しも思考量の変更も行いません。

### モデル別ポリシー

| 開発モデル | Very Low | Low | High | Very High |
|---|---|---|---|---|
| GPT-6.1 Sol | low | medium | high | xhigh |
| GPT-6.1 Terra | low | high | xhigh | max |
| GPT-6 Astra | low | low | medium | xhigh |
| GPT-6 Sol | low | medium | xhigh | max |
| GPT-6 Luna | low | high | xhigh | max |
| GPT-5.6 Sol | low | medium | xhigh | max |
| GPT-5.6 Terra | low | high | xhigh | max |
| GPT-5.6 Luna | low | high | xhigh | max |
| GPT-5.5 | low | high | xhigh | xhigh |

Fast版は**カタログのAPI modelIDが同じ場合**に同じ表を使います。名前の末尾から推測したり、モデルを切り替えたりはしません。未知モデル・API ID不明では共通表の`low / medium / high / xhigh`を使います。

VulcanBench、Datacurve DeepSWE、Artificial Analysis、Hex DataBench等を参考にした**暫定ポリシー**です。公式がこの割当を推奨しているわけではなく、最適性や実利用での品質・節約効果を保証しません。[選択方針](docs/MODEL-POLICIES.md)・[ベンチマーク比較](docs/MULTI-BENCHMARK-REVIEW.md)で根拠と限界を説明しています。

実際には、カタログで確認できた`reasoningEffort`だけを使います。min/maxの範囲内で切り上げ、なければ範囲内の最大対応値を選択します。対応不明・設定方式の混在・範囲内に候補がない場合は変更しません。`none`は自動選択しませんが、ユーザーの明示設定は保持します。

<a id="configuration"></a>
## 設定

すべて`plugins[].options`へ指定します。通常は必要な項目だけ設定してください。[全設定例](examples/opencode.jsonc)・[Luna設定例](examples/luna.jsonc)も利用できます。

| オプション | 既定値 | 説明 |
|---|---|---|
| `enabled` | `true` | `false`で手動固定も含め調整を停止 |
| `allowModelRequests` | `false` | Lunaへ指示を送信するための明示的許可 |
| `classifierModel` | `openai/gpt-6-luna#low` | 判定用Luna。`opencode`経由も指定可能 |
| `modelPolicy` | `benchmark` | モデル別表。`common`で共通表を使用 |
| `minEffort` | `low` | 選択する思考量の下限 |
| `maxEffort` | `max` | 選択する思考量の上限 |
| `manualOverride` | `null` | 思考量を手動固定。`null`で自動へ戻す |
| `maxModelRequests` | `100` | インスタンスのSDK呼び出し上限 |
| `timeoutMs` | `15000` | 判定の制限時間（ミリ秒） |

`minEffort`・`maxEffort`・`manualOverride`には`minimal / low / medium / high / xhigh / max`を指定できます。`minimal`の手動固定には下限も`minimal`へ変更してください。未対応の値はモデルへ送信しません。

> [!WARNING]
> **v0.2.0から、既定上限は`xhigh`ではなく`max`です。** 待ち時間や利用枠の消費が増える可能性があります。上限を維持したい場合は`maxEffort: "xhigh"`を明記してください。

従来の共通表と上限を使う場合は、既存の`options`に次の項目を設定します。

```jsonc
"modelPolicy": "common",
"maxEffort": "xhigh"
```

<details>
<summary>詳細オプションと入力チェック</summary>

| オプション | 既定値 | 説明 |
|---|---|---|
| `engine` | `model` | 互換用。`model`のみ指定可能、省略推奨 |
| `modelMaxInputChars` | `2000` | 送信するユーザー指示の合計文字数上限（1〜8,000）。固定の判定用指示は別 |
| `defaultEffort` | `medium` | 互換用の最終既定値。判定失敗時には適用しない |
| `cacheTtlMs` | `1800000` | キャッシュと状態のTTL（1〜86,400,000ms） |
| `maxEntries` | `256` | 各キャッシュ・状態の保持上限（1〜4,096） |
| `debug` | `false` | 思考量・難易度・キャッシュ命中をログ出力 |

`maxModelRequests`は1〜10,000、`timeoutMs`は1〜60,000msです。下限が上限を超える範囲、不正値、不明な設定キーは拒否し、プラグインを無効化します。判定用モデルが不在・無効・別APIモデルへの差替え・非対応variantの場合も、他モデルには切り替えません。

</details>

<a id="status"></a>
## 状態確認

TUIで次のコマンドを実行します。コマンドパレットの**Auto Reasoning: 状態を表示**からも確認できます。

```text
/reasoning-status
```

難易度、選択した思考量、制約適用前の推奨値、ポリシー、判定理由、判定時間、キャッシュ命中を表示します。読み取り専用で、新しい作業指示やモデル呼び出しは追加しません。

- 画面のモデルvariant表示自体は変更しません。
- 状態は**プラグインの選択値**です。後続処理を含む最終HTTP送信値を監視するものではありません。
- 詳細ツール`auto_reasoning_status`も利用できます。ただし、通常の指示でツール使用を依頼すると、その指示自体が判定対象になる場合があります。
- Lunaの正確なトークン量・請求額は取得できず、不明な使用量を0とは表示しません。セッション使用量がLunaの独立生成分を含むとも仮定しません。

<a id="privacy"></a>
## プライバシーと制限

### 送信する情報

ファイル・スキル展開前に捕捉したユーザー指示、直前2件の指示（各500文字以内）、添付数を基に、文字数上限を適用して判定します。展開後のソース、システム指示、ツール結果を判定入力の代用にはしません。元の指示との対応が確認できなければ調整しません。

コードフェンスや一般的な資格情報は除去しますが、**秘密情報の完全な検出・除去は保証しません**。機密作業では`enabled: false`または`allowModelRequests: false`にしてください。プラグインは認証情報を収集せず、指示全文や例外本文をログへ出しません。

### 利用枠・待ち時間

- 判定にも接続先の利用枠または料金を消費します。接続方式・契約を確認してください。
- `maxModelRequests`は**インスタンス単位のSDK呼び出し上限で、金額の上限ではありません**。再読み込みでリセットされ、プロジェクトごとのインスタンスに分かれます。
- 外部判定は同時1件です。別の判定が実行中なら、その結果を流用せず元設定を保持します。失敗もTTL内はキャッシュします。
- タイムアウト・停止を通知しますが、サーバー側の推論や課金の停止は保証しません。厳密な料金上限はプロバイダ側で管理してください。
- 高い思考量が常に良い結果になるとは限りません。特に6 Lunaの`max`では、公開評価でタイムアウト増加が報告されています。

<a id="validation"></a>
## 検証状況

| 検証項目 | 状況 |
|---|---|
| 自動テスト・型検査 | **98件成功**。全9系列×通常／Fast×4難易度の72組合せをモックで検証 |
| ビルド・配布物 | Windows／Linux CI、実tarballのオフラインインストール検証が成功 |
| 実OpenCode | 2.2.6でLuna判定、Solへのlow/xhigh送信、HTTP正常応答、状態RPCを確認 |
| モデル別ポリシー・maxの実送信 | **未検証**。実ホスト確認はv0.1.0の共通表によるもの |
| Desktop・native TUI描画・WebSocket・長時間のツール継続 | **実機未検証** |
| 実開発の品質・節約効果 | **未測定** |

既知のSDK推移依存の監査警告があります。v0.2.0公開時点ではmoderate 24件、high/criticalなしです。安全性を保証するものではありません。

詳細：[ポリシー検証](docs/MODEL-POLICY-VALIDATION.md) · [実ホスト検証](docs/LIVE-HOST-VALIDATION.md) · [分類精度評価](docs/ACCURACY.md)

<a id="development"></a>
## 開発・コントリビュート

不具合や改善案は[Issues](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/issues)へお寄せください。OpenCodeのバージョン、CLI／Desktop、開発モデルとvariant、機密情報を除いた再現手順を添えると調査しやすくなります。APIキー・指示全文・実プロジェクトのソースは投稿しないでください。

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run benchmark
npm run verify:package
```

通常のテストはモデル応答をモック化し、実モデルを呼びません。`benchmark`は検証処理・キャッシュ・保持上限を測るオフライン試験で、モデルの精度や速度を測るものではありません。実モデルによる評価は明示的な承認と利用条件の確認が必要です。

[開発ルール](AGENTS.md) · [変更履歴](CHANGELOG.md) · [リリース手順](docs/RELEASING.md)

<a id="license"></a>
## ライセンス

[MIT License](LICENSE) © 2026 MametaroGG

OpenCode・OpenAIの公式プロジェクトではありません。
