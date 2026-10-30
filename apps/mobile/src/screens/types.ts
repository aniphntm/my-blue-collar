// Minimal wallet-session view the screens need. App.tsx adapts whatever
// session hook is available to this shape, so screens stay decoupled.
export type SessionStatus = "disconnected" | "connecting" | "connected" | "wrong-network" | "error";

export type WalletSessionView = {
  status: SessionStatus;
  address?: string;
  chainId?: number;
  error?: string;
  connect: () => void;
  disconnect: () => void;
  switchToSepolia: () => void;
};

export type Balance =
  | { kind: "idle" | "loading" }
  | { kind: "ready"; wei: bigint }
  | { kind: "error"; message: string };
