export const labels = ["Very Low", "Low", "High", "Very High"] as const;
export type Label = (typeof labels)[number];
export interface AccuracyCase {
  id: string;
  expected: Label;
  text: string;
  previous?: string[];
  rationale: string;
}
export interface AccuracyResult {
  id: string;
  repetition: number;
  expected: Label;
  local: Label;
  actual: Label | null;
  hybrid: Label | null;
  durationMs: number;
  error?: string;
}
export function summarize(results: readonly AccuracyResult[], mode: "actual" | "local" | "hybrid") {
  const confusion = Object.fromEntries(labels.map(label => [label,
    Object.fromEntries([...labels, "error"].map(column => [column, 0]))]));
  let correct = 0, valid = 0, under = 0, over = 0, severeUnder = 0, hardUnder = 0, hardCount = 0;
  let absoluteError = 0;
  for (const r of results) {
    const actual = r[mode];
    confusion[r.expected]![actual ?? "error"]!++;
    const expectedRank = labels.indexOf(r.expected);
    if (expectedRank >= 2) hardCount++;
    if (!actual) continue;
    valid++;
    const delta = labels.indexOf(actual) - expectedRank;
    if (delta === 0) correct++;
    if (delta < 0) { under++; if (expectedRank >= 2) hardUnder++; }
    if (delta <= -2) severeUnder++;
    if (delta > 0) over++;
    absoluteError += Math.abs(delta);
  }
  const groups = new Map<string, (Label | null)[]>();
  for (const r of results) groups.set(r.id, [...(groups.get(r.id) ?? []), r[mode]]);
  const paired = [...groups.values()].filter(group => group.length === 2);
  const consistent = paired.filter(group => group[0] !== null && group[0] === group[1]).length;
  return { total: results.length, valid, invalid: results.length - valid, correct,
    accuracy: results.length ? correct / results.length : null,
    validOnlyAccuracy: valid ? correct / valid : null,
    under, over, severeUnder, hardUnder, hardCount,
    hardUnderRate: hardCount ? hardUnder / hardCount : null,
    meanAbsoluteClassError: valid ? absoluteError / valid : null,
    repeatability: { pairedCases: paired.length, consistent, rate: paired.length ? consistent / paired.length : null }, confusion };
}
