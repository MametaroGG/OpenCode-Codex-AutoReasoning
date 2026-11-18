# v0.2.5 — SDK 2.3.2 support

**Language:** [日本語](RELEASE-NOTES-v0.2.5.md) · English

An OpenCode V2 plugin that classifies task difficulty with GPT-6 Luna and adjusts the reasoning effort of the selected OpenAI model. The development model itself is never changed. Published on npm as `opencode-codex-autoreasoning` and on GitHub Packages as `@mametarogg/opencode-codex-autoreasoning`.

## Changes since v0.2.4

- Updated `@opencode/plugin` from 2.2.6 to 2.3.2. Typecheck, 146 tests, build and offline package verification all pass on the new SDK. Real HTTP dispatch was verified on 2.2.6; it has not been re-verified on 2.3.2.
- Rewrote the Japanese and English READMEs as a minimal layout built around a flow diagram and short tables. Removed version-pinning advice, development-time notes such as "since v0.2.0", and old Pre-release history.
- Added commented `minEffort` / `maxEffort` examples to the configuration snippet and reworded the diagram steps for clarity.
- The per-model policies for 32 API model IDs and the Luna classifier prompt are unchanged. See [the v0.2.4 release notes](RELEASE-NOTES-v0.2.4.md) for the policy details.

## Installation

Omitting the version installs npm's `latest` tag. Pin a version only if you need reproducibility.

```powershell
npm install --prefix ./auto-reasoning-plugin opencode-codex-autoreasoning --ignore-scripts
```

GitHub Packages requires authentication with `read:packages`:

```powershell
npm config set @mametarogg:registry https://npm.pkg.github.com
npm i @mametarogg/opencode-codex-autoreasoning --ignore-scripts
```

Set `plugins[].package` to the absolute path of the installation directory (`node_modules/opencode-codex-autoreasoning`, or `node_modules/@mametarogg/opencode-codex-autoreasoning` for GitHub Packages). External classification is disabled by default and requires `allowModelRequests: true`.

## Validation and limitations

- Typecheck, 146 tests, build, retention benchmark and offline tarball installation passed with SDK 2.3.2.
- 32 families × 4 difficulty levels, major Fast / Flex / Pro / Ultrafast aliases and catalog clamping verified with mocks.
- Real HTTP dispatch, Desktop / native TUI / WebSocket and real-world quality or savings are not verified. Luna's accuracy result uses 24 author-labeled synthetic tasks × 2 and is not a guarantee of downstream quality or savings.
- Requires Node.js 22+, OpenCode V2 and SDK 2.3.2. V1 is not supported. The adjustment target is the `openai` provider only.
- Known transitive SDK audit warnings remain. Before publishing, `npm audit --omit=dev` reported 23 moderate, 5 high and 0 critical advisories.

See [model policies](MODEL-POLICIES.md), [benchmark comparison](MULTI-BENCHMARK-REVIEW.md) and [classification accuracy](ACCURACY.md) for details.
