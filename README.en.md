<div align="center">

# OpenCode Codex Auto Reasoning

**Keep your model. Fit the reasoning effort to the task.**

An OpenCode V2 plugin that lets GPT-6 Luna classify task difficulty and automatically adjust the OpenAI model's reasoning effort.

[![npm](https://img.shields.io/npm/v/opencode-codex-autoreasoning?style=flat-square&logo=npm)](https://www.npmjs.com/package/opencode-codex-autoreasoning)
[![GitHub Package](https://img.shields.io/badge/GitHub_Packages-v0.2.4-18181b?style=flat-square)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/pkgs/npm/opencode-codex-autoreasoning)
[![Release v0.2.4](https://img.shields.io/badge/release-v0.2.4-22c55e?style=flat-square)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/tag/v0.2.4)
[![CI](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/actions/workflows/ci.yml)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-18181b?style=flat-square)](https://opencode.ai/)
[![Node.js 22+](https://img.shields.io/badge/Node.js-%3E%3D22-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[English](README.en.md) · [日本語](README.md) · [npm package](https://www.npmjs.com/package/opencode-codex-autoreasoning) · [GitHub Package](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/pkgs/npm/opencode-codex-autoreasoning) · [GitHub Releases](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/tag/v0.2.4) · [Quick start](#quick-start) · [Models](#models) · [Configuration](#configuration) · [Report an issue](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/issues)

</div>

---

## Features

- **Effort that follows the task** — classifies the instruction into four difficulty levels and selects the reasoning effort just before the request is sent.
- **Per-model policies** — covers all 32 reasoning-capable API model IDs. Fast / Flex / Pro / Ultrafast aliases share the table of the same API model ID. Distinguishes 14 families reviewed across multiple benchmarks (9 from 09 r2 + 5 from 18 r2), 7 single-sweep families, and 11 heuristic families.
- **You keep control of the model** — the plugin never switches your development model or rewrites session defaults.
- **Your settings win** — explicit variants and existing request-level settings are preserved. Manual overrides and effort caps are supported.
- **Fail safe** — on classification failure, timeout, or missing permission, the outgoing settings are left unchanged.
- **Only the necessary classifications** — identical instructions are cached and reclassification during tool continuations is suppressed.

> [!IMPORTANT]
> **v0.2.4 is published as a GitHub Release** (older v0.1.0–v0.2.3 remain Pre-releases). External classification requests are disabled by default. Enabling them requires `allowModelRequests: true` and may consume your provider's quota or incur charges. Real HTTP dispatch of the per-model policies, Desktop / native TUI, and real-world quality or savings have not been verified.

## Contents

- [Quick start](#quick-start)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Register with OpenCode](#setup)
- [Usage](#usage)
- [Models and reasoning effort](#models)
- [Configuration](#configuration)
- [Status](#status)
- [Privacy and limitations](#privacy)
- [Validation](#validation)
- [Development and contributing](#development)
- [License](#license)

Linked documents under `docs/` are currently written in Japanese.

<a id="quick-start"></a>
## Quick start

<a id="requirements"></a>
### 1. Requirements

| Item | Requirement |
|---|---|
| OpenCode | **V2**. Developed and verified against SDK 2.2.6. V1 is not supported |
| Node.js | **22 or newer** |
| Classifier model | A connected `openai/gpt-6-luna` or `opencode/gpt-6-luna` |
| Development model | An `openai` provider model whose reasoning effort settings can be verified |

The plugin runs on the OpenCode server side. **Verified through the CLI/API; Desktop is not verified.** The status UI is for TUI; there is no Desktop-specific UI.

<a id="installation"></a>
### 2. Installation

> [!NOTE]
> **Published on npm**: [`opencode-codex-autoreasoning`](https://www.npmjs.com/package/opencode-codex-autoreasoning) (latest at the time of writing: `0.2.4`). The `.tgz` on GitHub Releases contains the same content.

#### From npm (recommended)

```powershell
npm install --prefix ./auto-reasoning-plugin opencode-codex-autoreasoning --ignore-scripts
```

- `--prefix ./auto-reasoning-plugin` installs into a plugin-only folder, so your working project's dependencies are not modified.
- Omitting the version installs npm's `latest` tag (currently `0.2.4`). Add `@0.2.4` only if you need a reproducible pin.
- `--ignore-scripts` skips lifecycle scripts (this package has none).

The plugin will be at `auto-reasoning-plugin/node_modules/opencode-codex-autoreasoning`. Use the **absolute path** to that folder in your configuration.

If you do not mind adding it to your existing project, this works too:

```powershell
npm i opencode-codex-autoreasoning --ignore-scripts
```

In that case set `plugins[].package` to the absolute path `<project>/node_modules/opencode-codex-autoreasoning`.

#### From GitHub Packages

The same version is available as a [GitHub Package](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/pkgs/npm/opencode-codex-autoreasoning). GitHub Packages **requires authentication** (prepare a PAT with `read:packages`, for example).

```powershell
npm config set @mametarogg:registry https://npm.pkg.github.com
npm i @mametarogg/opencode-codex-autoreasoning --ignore-scripts
```

To pin the version, use `@mametarogg/opencode-codex-autoreasoning@0.2.4`.

Set `plugins[].package` to the absolute path `node_modules/@mametarogg/opencode-codex-autoreasoning`.

#### From GitHub Releases

Download these two files from the [v0.2.4 Release](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/releases/tag/v0.2.4):

- `opencode-codex-autoreasoning-0.2.4.tgz`
- `SHA256SUMS`

Compute the SHA-256 in PowerShell and check it against `SHA256SUMS` before installing.

```powershell
Get-FileHash ./opencode-codex-autoreasoning-0.2.4.tgz -Algorithm SHA256
npm install --prefix ./auto-reasoning-plugin ./opencode-codex-autoreasoning-0.2.4.tgz --ignore-scripts
```

The GitHub Releases tarball is generated from the same `package.json` and `dist` as the npm publication.

<details>
<summary>Building from source</summary>

```sh
git clone https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning.git
cd OpenCode-Codex-AutoReasoning
npm ci
npm run build
```

Set the configuration's `package` to the absolute path of the built repository folder. `main` may contain changes made after a release.

</details>

<a id="setup"></a>
### 3. Register with OpenCode

Add the following element to the existing `plugins` array in the target `opencode.jsonc`. **Do not replace your whole configuration.**

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      // Change this to the absolute path of the installation directory.
      "package": "C:/path/to/auto-reasoning-plugin/node_modules/opencode-codex-autoreasoning",
      "options": {
        "classifierModel": "openai/gpt-6-luna#low",
        // After reviewing data sending, quota, cost and data policy, change to true.
        "allowModelRequests": false
      }
    }
  ]
}
```

You do not need to put an API key in this configuration; OpenCode uses the provider you already connected. After checking the destination, entitlements, quota and cost, set `allowModelRequests` to `true` to enable automatic classification.

To apply it to every project, add the same element to `~/.config/opencode/opencode.jsonc` (or under `XDG_CONFIG_HOME` if set). Avoid registering it in both the project and the global file. No entry is needed in the terminal-only `cli.json`.

Configuration is normally reloaded on save. If necessary, run `/reload` and **start using it from a new instruction after the reload**.

<a id="usage"></a>
## Usage

1. In OpenCode, select the **OpenAI development model** you want to use.
2. Leave the reasoning variant unspecified (the normal `default` state).
3. Ask it to do your work as usual.
4. Use `/reasoning-status` in the TUI to see the difficulty and the selected effort.

```text
User instruction
    ↓
GPT-6 Luna classifies difficulty
    ↓
Apply the policy for the selected model
    ↓
Apply catalog-supported efforts and configured min/max
    ↓
Send to the same development model
```

If you specify something like `#high`, or the existing request already carries an effort setting, no automatic adjustment is made. A normal `default` is eligible, but a real catalog variant actually named `default` is treated as an explicit setting and preserved.

Priority order: **disabled → preserve existing request settings → manual override → preserve explicit variant → automatic classification**. Manual overrides are also clamped to the model's supported range and configured min/max.

<a id="models"></a>
## Models and reasoning effort

The classifier is **GPT-6 Luna only**, and the adjustment target is the **`openai` provider only**. For other providers, neither classification calls nor effort changes are made.

### Per-model policies

We checked the 98 entries of the OpenAI catalog as of 2026-11-18 and included every **32 API model IDs** that expose reasoning effort. Twenty-one families based on published measurements (14 multi-benchmark + 7 single-sweep) and 11 families designed from capability class because no public sweep is available are distinguished in the `policy` field of the status.

#### 21 families based on published measurements

The `Evidence` column means: **09 r2** = `benchmark-2026-11-09-r2` compared across multiple evaluations, **18 r2** = `benchmark-2026-11-18-r2` where five new families were re-reviewed with the same standard, **18 r1** = `benchmark-2026-11-18-r1` where only one effort sweep was found. None of these tables proves the optimal value for each of the four local difficulty labels.

| Development model | Very Low | Low | High | Very High | Evidence |
|---|---|---|---|---|---|
| GPT-6.1 Sol | low | medium | high | xhigh | 09 r2 |
| GPT-6.1 Terra | low | high | xhigh | max | 09 r2 |
| GPT-6 Astra | low | low | medium | xhigh | 09 r2 |
| GPT-6 Sol | low | medium | xhigh | max | 09 r2 |
| GPT-6 Luna | low | high | xhigh | max | 09 r2 |
| GPT-5.6 Sol | low | medium | xhigh | max | 09 r2 |
| GPT-5.6 Terra | low | high | xhigh | max | 09 r2 |
| GPT-5.6 Luna | low | high | xhigh | max | 09 r2 |
| GPT-5.5 | low | high | xhigh | xhigh | 09 r2 |
| GPT-6.2 Sol | low | medium | high | max | 18 r2 |
| GPT-6.2 Astra | low | medium | high | xhigh | 18 r2 |
| GPT-5.4 | low | low | medium | xhigh | 18 r2 |
| GPT-5.4 mini | low | medium | high | xhigh | 18 r2 |
| GPT-5.2 | low | medium | high | high | 18 r2 |
| GPT-5.4 nano | low | medium | high | xhigh | 18 r1 |
| GPT-5.3 Codex | low | medium | high | xhigh | 18 r1 |
| GPT-5.1 | low | medium | high | high | 18 r1 |
| GPT-5 / GPT-5 mini / GPT-5 nano | low | low | high | high | 18 r1 |
| o3 | low | medium | high | high | 18 r1 |

#### 11 heuristic families

| Development model | Class | Very Low | Low | High | Very High |
|---|---|---|---|---|---|
| GPT-6 Cyber, Daybreak Blue / Red, GPT-5.6 Cyber, GPT-5.6 | frontier | low | medium | high | xhigh |
| GPT-5.5 Pro, GPT-5.4 Pro, GPT-5.2 Pro, GPT-5 Pro, o3 Pro | frontier | low | medium | high | xhigh |
| GPT-5.3 Codex Spark | compact | low | low | medium | high |

**frontier** stays at `xhigh` even for Very High and never auto-selects `max`. **compact** caps at `high`. These are provisional policies derived from model names, catalog family and public positioning, not per-model effort benchmarks. You can always override explicitly with `manualOverride`.

Fast / Flex / Pro / Ultrafast aliases share the same table **only when the catalog API model ID is the same**. For example, `gpt-6.2-sol-fast` uses `gpt-6.2-sol`, and `gpt-6.1-terra-pro` uses `gpt-6.1-terra`. The plugin does not rewrite `gpt-5.6` to `gpt-5.6-sol`, or Daybreak to another model. It never guesses by stripping name suffixes or switches models. Unknown models or unknown API IDs use the common table `low / medium / high / xhigh`.

Models without a reasoning variant — `chat-latest`, `gpt-audio-1.5`, `gpt-5-search-api`, GPT-4.1 / GPT-4o family — are left completely unchanged.

Of the 21 measurement-based families, the 14 multi-benchmark families were reviewed with 09 r2 (VulcanBench, Datacurve DeepSWE, Artificial Analysis, Hex DataBench, etc.) and 18 r2 (two AA task suites, LiveBench, OckBench, Cognition FrontierCode, etc.). The 7 single-sweep families are **provisional policies** anchored to one LiveBench curve. The 11 heuristic families are **unmeasured policies** designed from capability class because primary evaluations are not available. None of this is an official recommendation, nor a guarantee of optimality or of real-world quality or savings. The rationale and limits are in [the selection policy](docs/MODEL-POLICIES.md) and [the benchmark comparison](docs/MULTI-BENCHMARK-REVIEW.md).

Only `reasoningEffort` values actually confirmed in the catalog are used. Within the configured min/max the next supported value is selected; if none is in range, the highest supported value is used. If support is unknown, configuration styles are mixed, or no candidate is in range, nothing is changed. `none` is never auto-selected, but an explicit user setting is preserved.

<a id="configuration"></a>
## Configuration

All options go under `plugins[].options`. Normally you only need a few of them. See also [the full example](examples/opencode.jsonc) and [the Luna example](examples/luna.jsonc).

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | `false` disables adjustment, including manual overrides |
| `allowModelRequests` | `false` | Explicit permission to send the instruction to Luna |
| `classifierModel` | `openai/gpt-6-luna#low` | Classifier Luna; `opencode` routing is also accepted |
| `modelPolicy` | `benchmark` | Per-model tables; `common` uses the legacy common table |
| `minEffort` | `low` | Lower bound for selected effort |
| `maxEffort` | `max` | Upper bound for selected effort |
| `manualOverride` | `null` | Pin the effort manually; `null` returns to automatic |
| `maxModelRequests` | `100` | Per-instance cap on SDK calls |
| `timeoutMs` | `15000` | Classification deadline in milliseconds |

`minEffort`, `maxEffort` and `manualOverride` accept `minimal / low / medium / high / xhigh / max`. For a manual `minimal` override, also set the lower bound to `minimal`. Unsupported values are never sent to the model.

> [!WARNING]
> **Since v0.2.0 the default upper bound is `max`, not `xhigh`.** This can increase latency and quota consumption. To keep the old ceiling, set `maxEffort: "xhigh"` explicitly.

To use the legacy common table and ceiling, add these to your existing `options`:

```jsonc
"modelPolicy": "common",
"maxEffort": "xhigh"
```

<details>
<summary>Advanced options and input checks</summary>

| Option | Default | Description |
|---|---|---|
| `engine` | `model` | Compatibility only. Only `model` is accepted; prefer omitting it |
| `modelMaxInputChars` | `2000` | Total character cap for sent user instructions (1–8,000). Fixed classifier instructions are separate |
| `defaultEffort` | `medium` | Legacy fallback default; not applied when classification fails |
| `cacheTtlMs` | `1800000` | TTL for caches and state (1–86,400,000 ms) |
| `maxEntries` | `256` | Retention limit for each cache/state (1–4,096) |
| `debug` | `false` | Log effort, difficulty and cache hits |

`maxModelRequests` must be 1–10,000 and `timeoutMs` 1–60,000 ms. Ranges whose lower bound exceeds the upper bound, invalid values, and unknown configuration keys are rejected and the plugin stays inactive. A missing, disabled, swapped-for-another-API-model, or unsupported-variant classifier never falls back to another model.

</details>

<a id="status"></a>
## Status

Run this command in the TUI. It is also available from the command palette as **Auto Reasoning: Show status**.

```text
/reasoning-status
```

It shows the difficulty, selected effort, recommendation before constraints, policy, classification reasons, classification time and cache hit. It is read-only and adds no new work instruction or model call.

- It does not change the model variant shown on screen.
- The status is the **plugin's selected value**. It does not observe the final HTTP payload of subsequent processing.
- The detailed tool `auto_reasoning_status` is also available. If a normal instruction asks for tool use, that instruction itself may become a classification target.
- Exact Luna token counts and billed amounts are not available; unknown usage is never shown as zero. Session usage is not assumed to include Luna's separate generation.

<a id="privacy"></a>
## Privacy and limitations

### What is sent

Classification uses the user instruction captured before file/skill expansion, the two immediately previous instructions (up to 500 characters each), and the attachment count, with a total character cap. Expanded source, system instructions, and tool results are not used as substitutes. If the instruction cannot be matched to the original, no adjustment is made.

Code fences and common credential patterns are removed, but **complete detection and removal of secrets is not guaranteed**. For confidential work, set `enabled: false` or `allowModelRequests: false`. The plugin does not collect credentials and does not log full instructions or exception bodies.

### Quota and latency

- Classification also consumes your connected provider's quota or money. Check your connection method and contract.
- `maxModelRequests` is a **per-instance SDK call cap, not a monetary cap**. It resets on reload and is separate per project instance.
- Classifications run one at a time. If another is in flight, its result is not reused and the original settings are kept. Failures are cached for the TTL as well.
- Timeouts and abort are reported, but stopping server-side inference or billing is not guaranteed. Manage strict cost limits with your provider.
- Higher effort is not always better. In published evaluations, GPT-6 Luna's `max` showed increased timeouts.

<a id="validation"></a>
## Validation

| Item | Status |
|---|---|
| Automated tests / typecheck | **146 passing**. 14 multi-benchmark families, 7 single-sweep families, 11 heuristic families, and major Fast / Flex / Pro / Ultrafast aliases × 4 difficulties verified with mocks |
| Build / distribution | Windows / Linux CI and offline installation of the real tarball succeeded |
| npm publication | `opencode-codex-autoreasoning@0.2.4` published to npm; clean install into a separate directory and `dist/index.js` import verified |
| GitHub Packages | `@mametarogg/opencode-codex-autoreasoning@0.2.4` published with the Actions `GITHUB_TOKEN` |
| Real OpenCode | Luna classification, low/xhigh dispatch to Sol, HTTP 200, and the status RPC verified on 2.2.6 |
| Per-model policy / real max dispatch | **Not verified**. Live host verification used the v0.1.0 common table |
| Desktop / native TUI rendering / WebSocket / long tool runs | **Not verified on a real machine** |
| Real-world quality / savings | **Not measured** |

Known transitive SDK audit warnings exist. Before publishing v0.2.4, `npm audit --omit=dev` reported 23 moderate, 5 high, and no critical advisories. This is a snapshot at that time and is not a security guarantee.

Details: [policy validation](docs/MODEL-POLICY-VALIDATION.md) · [live host validation](docs/LIVE-HOST-VALIDATION.md) · [classification accuracy](docs/ACCURACY.md)

<a id="development"></a>
## Development and contributing

Please report bugs and suggestions via [Issues](https://github.com/MametaroGG/OpenCode-Codex-AutoReasoning/issues). Including the OpenCode version, CLI vs Desktop, development model and variant, and a reproduction without confidential information helps investigation. Do not post API keys, full instructions, or source from real projects.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run benchmark
npm run verify:package
```

Normal tests mock model responses and never call a real model. `benchmark` is an offline test of validation, cache and retention limits — it does not measure model accuracy or latency. Real-model evaluation requires explicit approval and a review of the terms.

[Development rules](AGENTS.md) · [Changelog](CHANGELOG.md) · [Release process](docs/RELEASING.md)

<a id="license"></a>
## License

[MIT License](LICENSE) © 2026 MametaroGG

Not an official OpenCode or OpenAI project.
