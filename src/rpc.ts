import { Rpc } from "@opencode/plugin/rpc";

/** Read-only: no prompt admission, model generation, or configuration mutation. */
export const AutoReasoning = Rpc.define({
  id: "auto-reasoning",
  events: {},
  methods: {
    status: {
      input: {
        type: "object",
        properties: { sessionID: { type: "string", minLength: 1, maxLength: 256 } },
        required: ["sessionID"], additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          status: { type: "object" }, metrics: { type: "object" },
          usage: { type: ["object", "null"] }, retained: { type: "object" },
          classifier: { type: "object" },
        },
        required: ["status", "metrics", "usage", "retained", "classifier"], additionalProperties: false,
      },
    },
  },
});

export function statusSessionID(input: unknown): string {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid status request");
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== 1 || typeof value.sessionID !== "string" ||
      value.sessionID.length < 1 || value.sessionID.length > 256) throw new Error("Invalid status request");
  return value.sessionID;
}
