import { Text, View } from "react-native";
import { SEPOLIA } from "../ethereum";
import type { SessionStatus, WalletSessionView } from "./types";
import { Button, Card, OutlineButton, Screen, TestnetNote, styles } from "./ui";

const statusText: Record<SessionStatus, string> = {
  disconnected: "Not connected",
  connecting: "Connecting…",
  connected: "Connected",
  "wrong-network": "Wrong network",
  error: "Connection error",
};

export function Wallet({ session }: { session: WalletSessionView }) {
  const { status } = session;
  return <Screen>
    <Text style={styles.eyebrow}>WALLET & ACCOUNT</Text><Text accessibilityRole="header" style={styles.heading}>Wallet</Text>
    <TestnetNote />
    <Card title="Connection">
      <Text accessibilityLiveRegion="polite" style={styles.cardTitle}>Status: {statusText[status]}</Text>
      <Text selectable style={styles.address}>{session.address ?? "No address"}</Text>
      <View style={styles.network}><View style={styles.dot} /><Text style={styles.body}>Ethereum Sepolia · Chain ID {SEPOLIA.chainId}{status === "wrong-network" && session.chainId !== undefined ? ` · wallet is on chain ${session.chainId}` : ""}</Text></View>
      {status === "error" && <Text style={styles.body}>{session.error ?? "The wallet connection failed."}</Text>}
      {(status === "disconnected" || status === "error") && <Button label={status === "error" ? "Try again" : "Connect wallet"} onPress={session.connect} />}
      {status === "wrong-network" && <Button label="Switch to Sepolia" onPress={session.switchToSepolia} />}
      {(status === "connected" || status === "wrong-network" || status === "connecting") && <OutlineButton danger label={status === "connecting" ? "Cancel" : "Disconnect"} onPress={session.disconnect} />}
    </Card>
    <Card title="Your keys stay with you"><Text style={styles.body}>MyBluework never sees your keys. Every send is approved in your wallet app. Never share a recovery phrase with anyone.</Text></Card>
  </Screen>;
}
