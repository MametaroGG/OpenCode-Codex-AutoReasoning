import type { Effort } from "./config.js";

export interface Task {
  text: string;
  previous: readonly string[];
  attachments: number;
  /** Only sanitized, pre-attachment prompt-hook input may be sent to the classifier. */
  remoteInput?: { text: string; previous: readonly string[]; attachments: number };
}
export interface Decision {
  difficulty: "Very Low" | "Low" | "High" | "Very High";
  effort: Effort;
  reasons: string[];
  additionalTokens: number | null;
  source?: "model";
  classifierModel?: string;
}
export interface ModelStatistics {
  requests: number;
  inFlight: number;
  blocked: number;
  inputCharsSent: number;
}
export interface Classifier {
  readonly id: string;
  classify(task: Task, signal: AbortSignal): Decision | Promise<Decision>;
  statistics?(): ModelStatistics;
}
