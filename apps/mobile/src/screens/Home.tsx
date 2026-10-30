import { ActivityIndicator, Text, View } from "react-native";
import { formatEth, shortenAddress } from "../ethereum";
import type { Balance, SessionStatus, WalletSessionView } from "./types";
import { Button, Card, Chip, OutlineButton, Screen, styles } from "./ui";

export function Home({ session, balance, onRefresh, onSend }: {
  session: WalletSessionView; balance: Balance; onRefresh: () => void; onSend: () => void;
}) {
  const connected = session.status === "connected";
  const amount = connected && balance.kind === "ready" ? `${formatEth(balance.wei)} ETH`
    : connected && balance.kind === "loading" ? "Loading…" : "— ETH";
  const captions: Record<SessionStatus, string> = {
    disconnected: "Connect a wallet to read its Sepolia test ETH balance.",
    connecting: "Waiting for your wallet to approve the connection…",
    connected: session.address ? `Connected ${shortenAddress(session.address)} · Sepolia` : "Connected · Sepolia",
    "wrong-network": "Your wallet is on a different network. Switch to Ethereum Sepolia.",
    error: "The wallet connection failed.",
  };
  const caption = captions[session.status];
  const busy = (connected && balance.kind === "loading") || session.status === "connecting";
  return <Screen>
    <View style={styles.headingRow}><View style={styles.grow}><Text style={styles.eyebrow}>MYBLUEWORK WALLET</Text><Text accessibilityRole="header" style={styles.heading}>Home</Text></View><Chip /></View>
    <View style={styles.hero}>
      <Text style={styles.darkMuted}>Available test ETH · testnet, no real funds</Text>
      {busy && <ActivityIndicator color="#fff" style={styles.loader} />}
      <Text adjustsFontSizeToFit minimumFontScale={0.55} numberOfLines={1} style={styles.amount}>{amount}</Text>
      <Text style={styles.darkMuted}>{caption}</Text>
      {connected && <Button inverted label="Send test ETH" onPress={onSend} />}
      {session.status === "disconnected" && <Button inverted label="Connect wallet" onPress={session.connect} />}
      {session.status === "wrong-network" && <Button inverted label="Switch to Sepolia" onPress={session.switchToSepolia} />}
      {session.status === "connecting" && <Button inverted label="Cancel" onPress={session.disconnect} />}
    </View>
    {session.status === "error" && <View accessibilityLiveRegion="polite" style={styles.error}><Text style={styles.errorTitle}>Error: couldn’t connect wallet</Text><Text style={styles.body}>{session.error ?? "The wallet connection failed."}</Text><OutlineButton label="Try again" onPress={session.connect} /></View>}
    {session.status === "wrong-network" && <View accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.noticeTitle}>Warning: wrong network</Text><Text style={styles.body}>This app works on Ethereum Sepolia only. Balances and sending are paused until you switch.</Text></View>}
    {connected && balance.kind === "error" && <View accessibilityLiveRegion="polite" style={styles.error}><Text style={styles.errorTitle}>Error: couldn’t reach Sepolia</Text><Text style={styles.body}>{balance.message}</Text><OutlineButton label="Try again" onPress={onRefresh} /></View>}
    <Card title="Testnet wallet"><Text style={styles.body}>Sepolia ETH has no real monetary value. This app never asks for a seed phrase or private key; your wallet app approves every action.</Text>{connected && <OutlineButton label="Refresh balance" onPress={onRefresh} />}</Card>
    <Card title="Recent activity"><Text style={styles.body}>Unavailable: history needs a Sepolia indexer, which is not configured. The app never invents transactions.</Text></Card>
  </Screen>;
}
