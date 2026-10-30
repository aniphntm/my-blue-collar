import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Self-contained wallet connect control. It deliberately imports nothing from
 * Reown so it also renders on web. The wallet-session module owns the Reown
 * hooks and passes `onConnect` (open the AppKit modal) / `onDisconnect`.
 */
export type ConnectStatus = "disconnected" | "connecting" | "connected" | "error";

export type ConnectButtonProps = {
  status: ConnectStatus;
  address?: string;
  /** Chain the session is on; anything but Sepolia (11155111) is flagged. */
  chainId?: number;
  errorMessage?: string;
  /** Open the connect modal (disconnected / error states). */
  onConnect: () => void;
  /** Open the account / network modal (connected state). Falls back to onConnect. */
  onManage?: () => void;
  onDisconnect?: () => void;
};

const SEPOLIA_CHAIN_ID = 11155111;

export function shortAddress(address: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(address) ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function ConnectButton({ status, address, chainId, errorMessage, onConnect, onManage, onDisconnect }: ConnectButtonProps) {
  // Unknown chain is treated as unverified, never as Sepolia.
  const wrongChain = status === "connected" && chainId !== SEPOLIA_CHAIN_ID;
  const networkText = chainId === undefined ? "Network not verified · open wallet to check" : "Wrong network · switch to Sepolia";

  if (status === "connected") {
    return (
      <View style={styles.group}>
        <View
          accessible
          accessibilityLabel={`Connected wallet ${address ?? ""}. ${wrongChain ? networkText : "Ethereum Sepolia testnet."}`}
          style={styles.statusRow}
        >
          <Text style={styles.statusMark}>{wrongChain ? "!" : "✓"}</Text>
          <Text style={styles.statusText}>
            {wrongChain ? networkText : "Connected · Sepolia testnet"}
            {address ? `\n${shortAddress(address)}` : ""}
          </Text>
        </View>
        <Pressable accessibilityLabel="Open wallet connection options" accessibilityRole="button" onPress={onManage ?? onConnect} style={({ pressed }) => [styles.outline, pressed && styles.pressed]}>
          <Text style={styles.outlineText}>Manage wallet</Text>
        </Pressable>
        {onDisconnect && (
          <Pressable accessibilityLabel="Disconnect wallet" accessibilityRole="button" onPress={onDisconnect} style={({ pressed }) => [styles.outline, pressed && styles.pressed]}>
            <Text style={styles.dangerText}>Disconnect</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const connecting = status === "connecting";
  return (
    <View style={styles.group}>
      <Pressable
        accessibilityLabel={connecting ? "Connecting wallet, please wait" : "Connect wallet on Ethereum Sepolia testnet"}
        accessibilityRole="button"
        accessibilityState={{ disabled: connecting, busy: connecting }}
        disabled={connecting}
        onPress={onConnect}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed, connecting && styles.disabled]}
      >
        {connecting && <ActivityIndicator color="#ffffff" />}
        <Text style={styles.primaryText}>{connecting ? "Connecting…" : status === "error" ? "Try connecting again" : "Connect wallet"}</Text>
      </Pressable>
      {status === "error" && (
        <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorBox}>
          <Text numberOfLines={4} style={styles.errorText}>Couldn’t connect. {errorMessage ?? "Try again."}</Text>
        </View>
      )}
    </View>
  );
}

const MIN_TARGET = Platform.OS === "android" ? 48 : 44;
const radius = { borderRadius: 10, borderCurve: "continuous" as const };
const styles = StyleSheet.create({
  group: { gap: 10 },
  primary: { ...radius, minHeight: MIN_TARGET, backgroundColor: "#3457f1", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  outline: { ...radius, minHeight: MIN_TARGET, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 11 },
  outlineText: { color: "#3457f1", fontSize: 15, fontWeight: "700" },
  dangerText: { color: "#a32f24", fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.7 },
  statusRow: { ...radius, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e3e7ed", padding: 12 },
  statusMark: { color: "#3457f1", fontSize: 18, fontWeight: "700", width: 22, textAlign: "center" },
  statusText: { flex: 1, color: "#151923", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  errorBox: { ...radius, backgroundColor: "#fff5f3", borderWidth: 1, borderColor: "#f4c7c0", padding: 12 },
  errorText: { color: "#9f2d20", fontSize: 14, lineHeight: 20 },
});
