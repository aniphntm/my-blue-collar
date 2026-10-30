// Runtime configuration for the Reown (WalletConnect) session and Sepolia RPC.
// Never throws at import: invalid or missing values yield typed results.
// Only public values belong in EXPO_PUBLIC_* variables (they ship in the bundle).

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
// Same default as SEPOLIA.rpcUrl in ./ethereum.ts.
export const DEFAULT_SEPOLIA_RPC_URL = "https://rpc.sepolia.org";

/** Deep-link scheme; must match "scheme" in app.json. */
export const APP_SCHEME = "mybluework";
export const APP_REDIRECT_URL = `${APP_SCHEME}://`;

export type ReownConfigResult =
  | { status: "configured"; projectId: string }
  | { status: "not-configured"; reason: "missing" | "invalid"; message: string };

export type RpcConfigResult =
  | { ok: true; url: string; usedDefault: boolean }
  | { ok: false; url: string; message: string };

// Reown project IDs are 32-character hex strings.
const PROJECT_ID = /^[a-f0-9]{32}$/i;

export function resolveReownConfig(raw: string | undefined): ReownConfigResult {
  const value = raw?.trim();
  if (!value) {
    return { status: "not-configured", reason: "missing", message: "Wallet connection is not configured. Set EXPO_PUBLIC_REOWN_PROJECT_ID." };
  }
  if (!PROJECT_ID.test(value)) {
    return { status: "not-configured", reason: "invalid", message: "EXPO_PUBLIC_REOWN_PROJECT_ID is not a valid Reown project ID." };
  }
  return { status: "configured", projectId: value };
}

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h.startsWith("[")) return true;
  const m = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(h);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Accepts only public https URLs without credentials or query strings (where API keys usually hide). */
export function resolveSepoliaRpc(raw: string | undefined): RpcConfigResult {
  const value = raw?.trim();
  if (!value) return { ok: true, url: DEFAULT_SEPOLIA_RPC_URL, usedDefault: true };
  const fail = (message: string): RpcConfigResult => ({ ok: false, url: DEFAULT_SEPOLIA_RPC_URL, message });
  let url: URL;
  try { url = new URL(value); } catch { return fail("EXPO_PUBLIC_SEPOLIA_RPC_URL is not a valid URL."); }
  if (url.protocol !== "https:") return fail("EXPO_PUBLIC_SEPOLIA_RPC_URL must use https.");
  if (url.username || url.password) return fail("EXPO_PUBLIC_SEPOLIA_RPC_URL must not contain credentials.");
  if (url.search || url.hash) return fail("EXPO_PUBLIC_SEPOLIA_RPC_URL must be a public URL without a query string or fragment.");
  if (isPrivateHost(url.hostname)) return fail("EXPO_PUBLIC_SEPOLIA_RPC_URL must be a public host.");
  return { ok: true, url: value, usedDefault: false };
}

// Literal property access so Expo inlines the values at build time.
export const reownConfig: ReownConfigResult = resolveReownConfig(process.env.EXPO_PUBLIC_REOWN_PROJECT_ID);
export const sepoliaRpc: RpcConfigResult = resolveSepoliaRpc(process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL);

/** Validated Sepolia RPC URL (falls back to the public default when the override is rejected). */
export const SEPOLIA_RPC_URL: string = sepoliaRpc.url;
