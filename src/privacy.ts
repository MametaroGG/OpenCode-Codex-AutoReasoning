/** Best-effort minimization, NOT a guarantee that arbitrary user text is secret-free. */
export function sanitizePrompt(text: string, limit: number): string {
  return text.slice(0, 16_000)
    .replace(/```[\s\S]*?(?:```|$)/g, "[omitted-code]")
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g, "[redacted-key]")
    .replace(/\b(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|secret|authorization)\s*[:=][^\r\n]*/gi, "[redacted-credential]")
    .replace(/\b[A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD)\s*[:=][^\r\n]*/gi, "[redacted-credential]")
    .replace(/\bBearer\s+\S+/gi, "[redacted-bearer]")
    .replace(/\b(?:sk-[\w-]{12,}|gh[pousr]_[\w]{12,}|github_pat_[\w]{12,}|AIza[\w-]{20,})/g, "[redacted-token]")
    .slice(0, limit);
}

export function boundedModelInput(text: string, previous: readonly string[], attachments: number, limit: number) {
  const current = sanitizePrompt(text, limit);
  let remaining = limit - current.length;
  const context: string[] = [];
  for (const value of previous.slice(-2).reverse()) {
    if (remaining <= 0) break;
    const safe = sanitizePrompt(value, Math.min(remaining, 500));
    context.unshift(safe);
    remaining -= safe.length;
  }
  return { text: current, previous: context, attachments };
}
