import { authenticatedUser, guarded, json } from "@/lib/payments/server";
import { RailError } from "@/lib/payments/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return guarded(async () => {
    const userId = await authenticatedUser(request);
    const wallets = JSON.parse(process.env.ALCHEMY_OPERATOR_WALLETS ?? "{}");
    const address = wallets && Object.hasOwn(wallets, userId) ? wallets[userId] : undefined;
    if (typeof address !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(address)) throw new RailError(403, "Treasury wallet is not configured for this operator.");
    const apiKey = process.env.ALCHEMY_API_KEY;
    const network = process.env.ALCHEMY_NETWORK ?? "eth-sepolia";
    const chains: Record<string, string> = { "eth-mainnet": "0x1", "eth-sepolia": "0xaa36a7" };
    if (!apiKey || !Object.hasOwn(chains, network)) throw new RailError(503, "Alchemy is not configured.");
    const response = await fetch(`https://${network}.g.alchemy.com/v2/${encodeURIComponent(apiKey)}`, {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify([{ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] },
        { jsonrpc: "2.0", id: 2, method: "eth_getBalance", params: [address, "finalized"] }]),
    });
    if (!response.ok) throw new RailError(502, "Alchemy balance lookup failed.");
    const results: { id: number; result?: string; error?: unknown }[] = await response.json();
    if (!Array.isArray(results)) throw new RailError(502, "Invalid Alchemy response.");
    const chain = results.find(r => r.id === 1), balance = results.find(r => r.id === 2);
    if (chain?.error || chain?.result !== chains[network] || balance?.error || !/^0x[0-9a-f]+$/i.test(balance?.result ?? "")) throw new RailError(502, "Could not verify chain and finalized balance.");
    return json({ network, address, asset: "ETH", finalizedBalanceWei: BigInt(balance!.result!).toString(), fiatRedeemable: false });
  });
}
