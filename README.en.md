<div align="center">

# OpenCode Codex Auto Reasoning

**Keep your model. Fit the reasoning effort to the task.**

An OpenCode V2 plugin that lets GPT-6 Luna classify task difficulty and automatically adjust the OpenAI model's reasoning effort.

**Language:** [日本語](README.md) · English

[![npm](https://img.shields.io/npm/v/opencode-codex-autoreasoning?style=flat-square&logo=npm)](https://www.npmjs.com/package/opencode-codex-autoreasoning)
[![Release](https://img.shields.io/github/v/release/MametaroGG/OpenCode-Codex-AutoReasoning?style=flat-square&label=release&color=22c55e)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/latest)
[![CI](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

```mermaid
flowchart LR
    A[Instruction] --> B[Luna classifies difficulty]
    B --> C[Select effort for<br/>the chosen model]
    C --> D[Clamp to limits]
    D --> E[Same model, new effort]
```

> [!IMPORTANT]
> External classification requests are disabled by default (`allowModelRequests: true` to enable). They consume quota or money. Real HTTP dispatch of the per-model policies, Desktop / native TUI, and real-world quality or savings have not been verified.

## Installation

```powershell
npm install --prefix ./auto-reasoning-plugin opencode-codex-autoreasoning --ignore-scripts
```

Omitting the version installs `latest`. Pin a version only if needed. Other channels: [GitHub Releases](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/latest) · [GitHub Packages](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/pkgs/npm/opencode-codex-autoreasoning)

## Register with OpenCode

Add to the `plugins` array of `opencode.jsonc`. Do not replace your existing configuration.

```jsonc
{
  "plugins": [
    {
      "package": "C:/path/to/auto-reasoning-plugin/node_modules/opencode-codex-autoreasoning",
      "options": {
        "classifierModel": "openai/gpt-6-luna#low",
        // "minEffort": "low",   // lower bound (default low)
        // "maxEffort": "xhigh", // upper bound (default max)
        "allowModelRequests": false
      }
    }
  ]
}
```

Set `package` to the **absolute path** of the installation directory. Save, run `/reload`, and use it from the next new instruction. Explicit variants, existing effort settings and manual overrides are preserved. `minEffort` / `maxEffort` are optional and default to `low` / `max`.

## At a glance

| Item | Detail |
|---|---|
| Target | OpenCode V2 / Node.js 22+ / `openai` development models |
| Classifier | GPT-6 Luna (default `openai/gpt-6-luna#low`) |
| Sent data | Instruction, two previous instructions, attachment count only. No source or system instructions |
| External requests | Off by default; enabled with `allowModelRequests: true` |
| Coverage | 32 API model IDs (14 multi-benchmark / 7 single-sweep / 11 heuristic) |
| Verified | Typechecked and tested with SDK 2.3.2; real HTTP dispatch on 2.2.6 |

## Documentation

| Topic | Document |
|---|---|
| Models and policies | [MODEL-POLICIES.md](docs/MODEL-POLICIES.md) |
| Benchmark rationale and limits | [MULTI-BENCHMARK-REVIEW.md](docs/MULTI-BENCHMARK-REVIEW.md) |
| Options | [examples/opencode.jsonc](examples/opencode.jsonc) |
| Luna classification accuracy | [ACCURACY.md](docs/ACCURACY.md) |
| Validation status | [MODEL-POLICY-VALIDATION.md](docs/MODEL-POLICY-VALIDATION.md) |
| Release notes | [RELEASE-NOTES-v0.2.5.md](docs/RELEASE-NOTES-v0.2.5.md) |
| Changelog and release process | [CHANGELOG.md](CHANGELOG.md) · [RELEASING.md](docs/RELEASING.md) |

[MIT License](LICENSE) © 2026 MametaroGG · Not an official OpenCode or OpenAI project.
