import { Text, View } from "react-native";
import type { WalletSessionView } from "./types";
import { Button, Screen, styles } from "./ui";

// No indexer is configured, so there is nothing to list. Never fabricate rows.
export function Activity({ session }: { session: WalletSessionView }) {
  const connected = session.status === "connected";
  const title = connected ? "History unavailable" : "Connect a wallet first";
  const text = connected
    ? "Your test ETH balance is live, but transaction history needs a configured Sepolia indexer. No transactions are shown rather than guessing."
    : "Connect a wallet on Ethereum Sepolia to see its testnet information.";
  return <Screen>
    <Text style={styles.eyebrow}>ETHEREUM SEPOLIA · TESTNET</Text><Text accessibilityRole="header" style={styles.heading}>Activity</Text>
    <View style={styles.empty}><Text style={styles.emptyIcon}>↕</Text><Text style={styles.cardTitle}>{title}</Text><Text style={styles.center}>{text}</Text><Text style={styles.center}>Testnet only · amounts are in ETH · no real funds.</Text>{session.status === "disconnected" && <Button label="Connect wallet" onPress={session.connect} />}</View>
  </Screen>;
}
