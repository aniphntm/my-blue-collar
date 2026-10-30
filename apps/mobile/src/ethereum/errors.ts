export type SepoliaErrorCode =
  | "timeout"
  | "offline"
  | "rate_limited"
  | "invalid_response"
  | "wrong_chain"
  | "history_unavailable"
  | "unavailable"
  | "invalid_input";

const MESSAGES: Record<SepoliaErrorCode, string> = {
  timeout: "The Sepolia request timed out. Try again.",
  offline: "You appear to be offline. Check your connection and try again.",
  rate_limited: "The Sepolia RPC is rate limiting requests. Wait a moment and try again.",
  invalid_response: "Sepolia returned an invalid response.",
  wrong_chain: "The configured RPC is not Ethereum Sepolia.",
  history_unavailable: "This Sepolia RPC cannot provide that transaction history.",
  unavailable: "Sepolia is unavailable right now.",
  invalid_input: "The public Ethereum address is invalid.",
};

export class SepoliaError extends Error {
  readonly code: SepoliaErrorCode;
  constructor(code: SepoliaErrorCode, message?: string) {
    super(message ?? MESSAGES[code]);
    this.name = "SepoliaError";
    this.code = code;
  }
}
