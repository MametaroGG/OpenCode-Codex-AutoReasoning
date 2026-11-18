<div align="center">

# OpenCode Codex Auto Reasoning

**モデルはそのまま。思考量は、タスクに合わせて。**

GPT-6 Lunaが難易度を判定し、OpenAIのreasoning effortを自動調整するOpenCode V2プラグイン。

**Language:** 日本語 · [English](README.en.md)

[![npm](https://img.shields.io/npm/v/opencode-codex-autoreasoning?style=flat-square&logo=npm)](https://www.npmjs.com/package/opencode-codex-autoreasoning)
[![Release](https://img.shields.io/github/v/release/MametaroGG/OpenCode-Codex-AutoReasoning?style=flat-square&label=release&color=22c55e)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/latest)
[![CI](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

```mermaid
flowchart LR
    A[ユーザー指示] --> B[Lunaが難易度を判定]
    B --> C[モデルごとの<br/>思考量を選択]
    C --> D[下限・上限を反映]
    D --> E[同じモデルへ送信]
```

> [!IMPORTANT]
> 判定の外部送信は既定で無効（`allowModelRequests: true`で有効化）。利用枠・料金が発生します。モデル別ポリシーの実HTTP送信とDesktop／native TUIは未検証です。実利用の品質・節約効果は未測定です（利用実績はありますが、トークン量・費用の対比データがありません）。

## インストール

```powershell
npm i opencode-codex-autoreasoning --ignore-scripts
```

バージョン指定を省くと`latest`を入ります。固定したい場合のみバージョンを付けてください。プロジェクトの依存を追加したくない場合は専用フォルダへ入れることもできます。

```powershell
npm install --prefix ./auto-reasoning-plugin opencode-codex-autoreasoning --ignore-scripts
```

他経路:[GitHub Releases](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/latest) · [GitHub Packages](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/pkgs/npm/opencode-codex-autoreasoning)

## OpenCodeに登録

`opencode.jsonc`の`plugins`へ追加（既存設定は置き換えない）:

```jsonc
{
  "plugins": [
    {
      "package": "C:/path/to/your-project/node_modules/opencode-codex-autoreasoning",
      "options": {
        "classifierModel": "openai/gpt-6-luna#low",
        // "minEffort": "low",   // 下限（既定 low）
        // "maxEffort": "xhigh", // 上限（既定 max）
        "allowModelRequests": false
      }
    }
  ]
}
```

`package`はインストール先の**絶対パス**（`npm i`なら`node_modules/opencode-codex-autoreasoning`、専用フォルダを使う場合は`auto-reasoning-plugin/node_modules/opencode-codex-autoreasoning`）。GitHub Packagesの場合は`node_modules/@mametarogg/opencode-codex-autoreasoning`です。保存後`/reload`し、次の新しい指示から適用。明示variant・既存の思考量設定・手動指定は保持されます。`minEffort` / `maxEffort`は任意で、既定は`low` / `max`です。

## 要点

| 項目 | 内容 |
|---|---|
| 対象 | OpenCode V2 / Node.js 22+ / `openai`プロバイダの開発モデル |
| 判定役 | GPT-6 Luna（既定`openai/gpt-6-luna#low`） |
| 送信内容 | 指示・直前2件・添付数のみ。ソース／システム指示は送らない |
| 外部送信 | 既定オフ。`allowModelRequests: true`で有効化 |
| 対応系列 | 32のAPI modelID（複数ベンチ14／単一sweep7／ヒューリスティック11） |
| 検証 | SDK 2.3.2で型検査・テスト。実機HTTP送信は2.2.6で確認 |

## 詳細

| 項目 | ドキュメント |
|---|---|
| 対応モデルと選択ポリシー | [MODEL-POLICIES.md](docs/MODEL-POLICIES.md) |
| ベンチマークの根拠と限界 | [MULTI-BENCHMARK-REVIEW.md](docs/MULTI-BENCHMARK-REVIEW.md) |
| 設定項目 | [examples/opencode.jsonc](examples/opencode.jsonc) |
| Luna判定の精度 | [ACCURACY.md](docs/ACCURACY.md) |
| 検証状況 | [MODEL-POLICY-VALIDATION.md](docs/MODEL-POLICY-VALIDATION.md) |
| リリースノート | [RELEASE-NOTES-v0.2.5.md](docs/RELEASE-NOTES-v0.2.5.md) |
| 変更履歴・リリース手順 | [CHANGELOG.md](CHANGELOG.md) · [RELEASING.md](docs/RELEASING.md) |

[MIT License](LICENSE) © 2026 MametaroGG · OpenCode・OpenAIの公式プロジェクトではありません。
