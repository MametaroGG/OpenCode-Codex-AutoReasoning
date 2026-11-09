// Historical comparison only. Never imported by src/ or included in the package.
import type { Classifier, Decision, Task } from "../../src/classifier.js";

/** Multi-factor local estimator, not a semantic AI classifier. Never reads project files. */
const continuation = /^(?:開発(?:を)?続けて|続けて(?:ください)?|続きを|それを|お願いします|continue|do it|yes)[。.!\s]*$/i;

function classifyLocal(task: Task): Decision {
    const text = task.text.slice(0, 16_000);
    if (continuation.test(text.trim())) {
      const previous = [...task.previous.slice(-2)].reverse().find(p => !continuation.test(p.trim()) && p.trim());
      if (previous) {
        const inherited = classifyLocal({ text: previous, previous: [], attachments: 0 });
        return { ...inherited, reasons: [...inherited.reasons, "continuation-context"] };
      }
    }
    const cosmeticStyle = /(?:色|余白|フォントサイズ|\b(?:color|margin|padding|font.size)\b)/i.test(text) &&
      /変更|修正|\b(?:change|set|update)\b/i.test(text);
    const simple = /誤字|脱字|typo|スペル|文言|表記|コメント|comment|rename|名前.*変更/i.test(text) || cosmeticStyle;
    // Literal replacement targets are not scope evidence (e.g. a typo in “distributed system”).
    const literalScope = simple && text.length < 600
      ? text.replace(/『[^』]*』|「[^」]*」|“[^”]*”|"[^"\n]*"|`[^`\n]*`/g, "") : text;
    // Explicitly excluded construction is not requested work. Keep the original prompt untouched.
    const scope = literalScope.replace(/[^。！？\n、,;；]*(?:実装|構築|設計)(?:しないで|せず|しない|は不要)/g, "");
    const paths = new Set(text.match(/[\w./-]+\.(?:tsx?|jsx?|py|cs|go|rs|json|md)\b/g) ?? []);
    const count = Math.max(paths.size, task.attachments,
      Number(text.match(/(\d+)\s*(?:ファイル|files?)/i)?.[1] ?? 0));
    const broad = /複数ファイル|全体|横断|依存関係|後方互換|across|multi.file|backward.compatib/i.test(scope);
    const algorithm = /アルゴリズム|並行|競合|分散|デッドロック|トランザクション|algorithm|concurren|race condition|distributed|deadlock/i.test(scope);
    const design = /アーキテクチャ|大規模|再設計|architecture|redesign|system design/i.test(scope);
    const uncertain = /原因不明|再現.*(?:困難|しない)|断続|intermittent|unknown cause|hard to reproduce/i.test(scope);
    const retry = /まだ.*(?:直|失敗)|再試行|再度|前回.*失敗|still.*(?:fail|broken)|try again/i.test(scope);
    const quality = /厳密|形式検証|セキュリティ|データ損失|本番|formal.verif|security|data loss|production/i.test(scope);
    const specialist = /型検査器?|コンパイラ|モデル検査|暗号プロトコル|type.?checker|compiler|model checker|cryptographic protocol/i.test(scope);
    const construction = /実装|構築|新規|設計|\b(?:implement|build|design|create)\b/i.test(scope);
    const boundedExample = /最小(?:構成|例)|サンプル|例示|\b(?:toy|demo|example)\b/i.test(scope) &&
      !broad && !quality && !uncertain && count <= 1;
    const specialistBuild = specialist && construction && !boundedExample;
    const steps = (text.match(/(?:^|\n)\s*(?:[-*]|\d+[.)、])\s*/g) ?? []).length;
    const score = (count > 1 || broad ? 2 : 0) + (count >= 8 ? 1 : 0) +
      (algorithm ? 2 : 0) + (design ? 3 : 0) + (uncertain ? 2 : 0) +
      (retry ? 1 : 0) + (quality ? 1 : 0) + (steps >= 4 ? 1 : 0) + (specialistBuild ? 6 : 0);
    const reasons: string[] = [];
    if (count > 1 || broad) reasons.push("multiple-files-or-dependencies");
    if (algorithm) reasons.push("algorithm-or-concurrency");
    if (design) reasons.push("architecture-design");
    if (uncertain) reasons.push("uncertain-failure-cause");
    if (retry) reasons.push("retry-reported");
    if (quality) reasons.push("correctness-sensitive");
    if (steps >= 4) reasons.push("multi-step-requirements");
    if (specialistBuild) reasons.push("specialist-system-construction");
    if (specialist && construction && boundedExample) reasons.push("bounded-specialist-example");
    if (score >= 6) return { difficulty: "Very High", effort: "xhigh", reasons, additionalTokens: 0 };
    if (score >= 2) return { difficulty: "High", effort: "high", reasons, additionalTokens: 0 };
    if (simple && score === 0 && count <= 1 && text.length < 600) {
      return { difficulty: "Very Low", effort: "low", reasons: ["narrow-textual-edit"], additionalTokens: 0 };
    }
    return { difficulty: "Low", effort: "medium", reasons: reasons.length ? reasons : ["limited-or-unknown-scope"], additionalTokens: 0 };
}

export const localClassifier: Classifier = { id: "local-v2", classify: classifyLocal };
