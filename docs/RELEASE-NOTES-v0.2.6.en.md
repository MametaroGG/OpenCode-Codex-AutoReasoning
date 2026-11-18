# v0.2.6 — Local measurement log

**Language:** [日本語](RELEASE-NOTES-v0.2.6.md) · English

With `measurement: true`, the plugin can record decision metadata and host-reported usage in a bounded local log. It is off by default and never sends data anywhere.

## What is and is not recorded

- Recorded: timestamp, session reference (first 16 hex chars of sha256), difficulty, requested/selected effort, policy, reason, cache hit, decision duration, classifier model, development model ID, whether settings changed, and the host's token/cost figures from `session.usage.updated`.
- Never stored: user instructions, previous instructions, resolved source, system instructions, tool results, file paths, credentials, or raw session IDs.

Retention is a ring of `maxEntries` (default 256, cap 4096), cleared on unload. The only read paths are `auto_reasoning_status` and the `measurement` field of the `auto-reasoning` RPC.

## Limits

This log lets you correlate decisions with usage afterwards; it is **not proof of savings**. Session-level cumulative usage cannot be split into individual calls, no control condition was captured under the same conditions, and the classifier call's own usage is not returned by the API. See the [validation record](VALIDATION.md#ローカル計測--measurement) for details.

## Unchanged

The 32 per-model policies, Luna classifier prompt, SDK 2.3.2 support and 151 passing tests are unchanged from v0.2.5.
