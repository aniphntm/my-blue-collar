import { StyleSheet, Text, View } from "react-native";

/** Shown when no Reown project ID is configured. Self-contained; no config import. */
export function NotConfigured() {
  return (
    <View
      style={styles.panel}
    >
      <Text style={styles.eyebrow}>SETUP REQUIRED · TESTNET</Text>
      <Text accessibilityRole="header" style={styles.title}>Wallet connection isn’t set up</Text>
      <Text style={styles.body}>
        This build has no Reown project ID, so wallets can’t be connected yet. Add one to your local environment configuration and restart the app.
      </Text>
      <Text style={styles.body}>Ethereum Sepolia testnet only. No real funds. The app never asks for a seed phrase or private key.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#171b28", borderRadius: 18, borderCurve: "continuous", padding: 24, gap: 12 },
  eyebrow: { color: "#bfc7d7", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  title: { color: "#ffffff", fontSize: 20, fontWeight: "700" },
  body: { color: "#d5dbe8", fontSize: 15, lineHeight: 23 },
});
