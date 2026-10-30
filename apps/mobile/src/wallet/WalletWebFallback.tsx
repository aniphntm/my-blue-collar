import { StyleSheet, Text, View } from "react-native";

/**
 * Rendered on web instead of anything that imports Reown's native AppKit.
 * Select it with Platform.OS === "web" in the wallet module.
 */
export function WalletWebFallback() {
  return (
    <View
      style={styles.card}
    >
      <Text style={styles.eyebrow}>ETHEREUM SEPOLIA · TESTNET · NO REAL FUNDS</Text>
      <Text accessibilityRole="header" style={styles.title}>Open the mobile app to connect</Text>
      <Text style={styles.body}>Wallet connections use the native Reown kit and aren’t available in the web preview. Use the iOS or Android app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#ffffff", borderColor: "#e3e7ed", borderWidth: 1, borderRadius: 16, borderCurve: "continuous", padding: 20, gap: 10 },
  eyebrow: { color: "#667085", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  title: { color: "#151923", fontSize: 17, fontWeight: "700" },
  body: { color: "#667085", fontSize: 15, lineHeight: 23 },
});
