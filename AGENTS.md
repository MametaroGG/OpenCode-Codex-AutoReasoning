# Development rules

- Target OpenCode V2 and the pinned official @opencode/plugin API.
- Consult https://opencode.ai/docs/build/plugins/server before changing hooks.
- Never read credentials, environment variables, or project source for classification.
- Never call an external AI or CLI without explicit approval and verified terms.
- Hook failures must leave outgoing settings unchanged. Do not mutate session/model defaults.
- Bound all caches and session state; clean up registrations on unload.
- Run npm run typecheck, npm test, npm run build, and npm run benchmark.
- Document heuristic limitations. Do not claim measured model savings from local benchmarks.
