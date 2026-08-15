import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  AccessibilityInfo, ActivityIndicator, Alert, Linking, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import {
  SEPOLIA, buildSepoliaTransferUri, fetchSepoliaBalance, formatEth,
  isEthereumAddress, shortenAddress,
} from "./src/ethereum";

type Tab = "Home" | "Activity" | "Wallet";
type Balance = { kind: "idle" | "loading" } | { kind: "ready"; wei: bigint } | { kind: "error"; message: string };
const tabs: Array<{ key: Tab; icon: string }> = [
  { key: "Home", icon: "⌂" }, { key: "Activity", icon: "↕" }, { key: "Wallet", icon: "◇" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<Balance>({ kind: "idle" });
  const [connectOpen, setConnectOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const refresh = useCallback(async (candidate = address) => {
    if (!isEthereumAddress(candidate)) return;
    setBalance({ kind: "loading" });
    try { setBalance({ kind: "ready", wei: await fetchSepoliaBalance(candidate) }); }
    catch (error) {
      setBalance({ kind: "error", message: error instanceof Error ? error.message : "Sepolia is unavailable." });
    }
  }, [address]);

  useEffect(() => {
    if (balance.kind === "error") AccessibilityInfo.announceForAccessibility(balance.message);
  }, [balance]);

  const connect = (candidate: string) => {
    const next = candidate.trim();
    if (!isEthereumAddress(next)) {
      Alert.alert("Check the address", "Enter a complete public Ethereum address beginning with 0x.");
      return;
    }
    setAddress(next); setConnectOpen(false); void refresh(next);
  };

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.banner}><Text style={styles.bannerText}>ETHEREUM SEPOLIA · TESTNET · NO REAL FUNDS</Text></View>
      <View style={styles.content}>
        {tab === "Home" && <Home address={address} balance={balance} onConnect={() => setConnectOpen(true)} onRefresh={() => void refresh()} onSend={() => setSendOpen(true)} />}
        {tab === "Activity" && <Activity address={address} />}
        {tab === "Wallet" && <Wallet address={address} onConnect={() => setConnectOpen(true)} onDisconnect={() => { setAddress(""); setBalance({ kind: "idle" }); }} />}
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map(({ key, icon }) => {
          const selected = tab === key;
          return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={key} onPress={() => setTab(key)} style={[styles.tab, selected && styles.tabActive]}>
            <Text style={[styles.tabIcon, selected && styles.blue]}>{icon}</Text><Text style={[styles.tabLabel, selected && styles.blue]}>{key}</Text>
          </Pressable>;
        })}
      </View>
      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} onConnect={connect} />
      <SendModal balance={balance.kind === "ready" ? balance.wei : null} open={sendOpen} onClose={() => setSendOpen(false)} />
    </View>
  );
}

function Home({ address, balance, onConnect, onRefresh, onSend }: {
  address: string; balance: Balance; onConnect: () => void; onRefresh: () => void; onSend: () => void;
}) {
  const amount = balance.kind === "ready" ? `${formatEth(balance.wei)} ETH` : balance.kind === "loading" ? "Loading…" : "— ETH";
  return <Screen>
    <View style={styles.headingRow}><View style={styles.grow}><Text style={styles.eyebrow}>MYBLUEWORK WALLET</Text><Text style={styles.heading}>Home</Text></View><Chip /></View>
    <View style={styles.hero}>
      <Text style={styles.darkMuted}>Available test ETH</Text>
      {balance.kind === "loading" && <ActivityIndicator color="#fff" style={styles.loader} />}
      <Text adjustsFontSizeToFit minimumFontScale={0.55} numberOfLines={1} style={styles.amount}>{amount}</Text>
      <Text style={styles.darkMuted}>{address ? `Watching ${shortenAddress(address)}` : "Connect a public address to read its Sepolia balance."}</Text>
      <Button inverted label={address ? "Send test ETH" : "Connect wallet"} onPress={address ? onSend : onConnect} />
    </View>
    {balance.kind === "error" && <View accessibilityLiveRegion="polite" style={styles.error}><Text style={styles.errorTitle}>Couldn’t reach Sepolia</Text><Text style={styles.body}>{balance.message}</Text><OutlineButton label="Try again" onPress={onRefresh} /></View>}
    <Card title="Testnet wallet"><Text style={styles.body}>Sepolia ETH has no real monetary value. This app never asks for a seed phrase or private key.</Text>{address && <OutlineButton label="Refresh balance" onPress={onRefresh} />}</Card>
    <Card title="Recent activity"><Text style={styles.body}>History appears after a Sepolia indexer is configured. The app never invents live transactions.</Text></Card>
  </Screen>;
}

function Activity({ address }: { address: string }) {
  return <Screen><Text style={styles.eyebrow}>ETHEREUM SEPOLIA</Text><Text style={styles.heading}>Activity</Text>
    <View style={styles.empty}><Text style={styles.emptyIcon}>↕</Text><Text style={styles.cardTitle}>{address ? "History provider not connected" : "Connect a wallet first"}</Text><Text style={styles.center}>{address ? "Your balance is live, but transaction history needs a configured Sepolia indexer." : "Add a public Ethereum address to view Sepolia wallet information."}</Text></View>
  </Screen>;
}

function Wallet({ address, onConnect, onDisconnect }: { address: string; onConnect: () => void; onDisconnect: () => void }) {
  return <Screen><Text style={styles.eyebrow}>WALLET & ACCOUNT</Text><Text style={styles.heading}>Wallet</Text>
    <Card title="Connection"><Text selectable style={styles.address}>{address || "Not connected"}</Text><View style={styles.network}><View style={styles.dot} /><Text style={styles.body}>Ethereum Sepolia · Chain ID {SEPOLIA.chainId}</Text></View><Button label={address ? "Change public address" : "Connect wallet"} onPress={onConnect} />{address && <OutlineButton danger label="Disconnect" onPress={onDisconnect} />}</Card>
    <Card title="Your keys stay with you"><Text style={styles.body}>This build is watch-only. Sending hands the request to an external wallet for approval. Never share a recovery phrase with MyBluework.</Text></Card>
  </Screen>;
}

function ConnectModal({ open, onClose, onConnect }: { open: boolean; onClose: () => void; onConnect: (value: string) => void }) {
  const [value, setValue] = useState("");
  return <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={open}><Screen modal><Text style={styles.eyebrow}>WATCH-ONLY CONNECTION</Text><Text style={styles.heading}>Connect wallet</Text><Text style={styles.body}>Paste only your public Ethereum address. Never enter a private key or seed phrase.</Text><Field label="Public address" placeholder="0x…" value={value} onChange={setValue} /><Button label="Connect on Sepolia" onPress={() => onConnect(value)} /><OutlineButton label="Cancel" onPress={onClose} /></Screen></Modal>;
}

function SendModal({ balance, open, onClose }: { balance: bigint | null; open: boolean; onClose: () => void }) {
  const [recipient, setRecipient] = useState(""); const [amount, setAmount] = useState("");
  const send = async () => {
    if (!isEthereumAddress(recipient.trim())) { Alert.alert("Check the recipient", "Enter a valid public Ethereum address."); return; }
    try {
      const uri = buildSepoliaTransferUri(recipient.trim(), amount);
      if (!(await Linking.canOpenURL(uri))) { Alert.alert("External wallet needed", "Install a wallet that supports Ethereum payment links."); return; }
      await Linking.openURL(uri); onClose();
    } catch (error) { Alert.alert("Check the amount", error instanceof Error ? error.message : "Enter a valid ETH amount."); }
  };
  return <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={open}><Screen modal><Text style={styles.eyebrow}>SEPOLIA TEST TRANSACTION</Text><Text style={styles.heading}>Send test ETH</Text><View style={styles.warning}><Text style={styles.warningText}>Testnet only. Sepolia ETH is not real money.</Text></View><Field label="Recipient public address" placeholder="0x…" value={recipient} onChange={setRecipient} /><Field decimal label="Amount in ETH" placeholder="0.001" value={amount} onChange={setAmount} /><Text style={styles.body}>Available: {balance === null ? "unknown" : `${formatEth(balance)} ETH`}. Your external wallet calculates fees and asks for final approval.</Text><Button label="Continue in external wallet" onPress={() => void send()} /><OutlineButton label="Cancel" onPress={onClose} /></Screen></Modal>;
}

function Screen({ children, modal = false }: { children: React.ReactNode; modal?: boolean }) { return <ScrollView contentContainerStyle={[styles.screen, modal && styles.modal]} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">{children}</ScrollView>; }
function Card({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Chip() { return <View style={styles.chip}><Text style={styles.chipText}>Sandbox</Text></View>; }
function Field({ label, placeholder, value, onChange, decimal = false }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; decimal?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} inputMode={decimal ? "decimal" : "text"} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#7b8495" style={styles.input} value={value} /></View>; }
function Button({ label, onPress, inverted = false }: { label: string; onPress: () => void; inverted?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, inverted && styles.buttonInverted]}><Text style={[styles.buttonText, inverted && styles.buttonTextInverted]}>{label}</Text></Pressable>; }
function OutlineButton({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={styles.outlineButton}><Text style={[styles.outlineText, danger && styles.danger]}>{label}</Text></Pressable>; }

const radius = { borderRadius: 16, borderCurve: "continuous" as const };
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: "#f7f8fb" }, content: { flex: 1 }, grow: { flex: 1 },
  banner: { minHeight: Platform.OS === "ios" ? 50 : 36, paddingTop: Platform.OS === "ios" ? 18 : 6, paddingHorizontal: 12, backgroundColor: "#fff4db", justifyContent: "center" },
  bannerText: { color: "#7a4a00", fontSize: 11, fontWeight: "700", letterSpacing: 0.7, textAlign: "center" },
  screen: { padding: 20, paddingBottom: 36, gap: 18 }, modal: { paddingTop: Platform.OS === "ios" ? 42 : 24 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12 }, eyebrow: { color: "#7b8495", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 }, heading: { color: "#151923", fontSize: 30, fontWeight: "700", letterSpacing: -0.7 },
  chip: { ...radius, borderRadius: 999, backgroundColor: "#fff4db", paddingHorizontal: 12, paddingVertical: 7 }, chipText: { color: "#a36100", fontSize: 12, fontWeight: "700" },
  hero: { ...radius, borderRadius: 18, backgroundColor: "#171b28", padding: 24, gap: 14 }, darkMuted: { color: "#bfc7d7", fontSize: 15, lineHeight: 22 }, loader: { alignSelf: "flex-start" }, amount: { color: "#fff", fontSize: 46, fontWeight: "700", letterSpacing: -2.3 },
  card: { ...radius, backgroundColor: "#fff", borderColor: "#e3e7ed", borderWidth: 1, padding: 20, gap: 14 }, cardTitle: { color: "#151923", fontSize: 17, fontWeight: "700" }, body: { color: "#667085", fontSize: 15, lineHeight: 23 }, center: { color: "#667085", fontSize: 15, lineHeight: 23, textAlign: "center" },
  error: { ...radius, backgroundColor: "#fff5f3", borderColor: "#f4c7c0", borderWidth: 1, padding: 20, gap: 12 }, errorTitle: { color: "#9f2d20", fontSize: 17, fontWeight: "700" },
  empty: { ...radius, backgroundColor: "#fff", borderColor: "#e3e7ed", borderWidth: 1, padding: 28, gap: 14, alignItems: "center" }, emptyIcon: { color: "#3457f1", fontSize: 32 },
  address: { color: "#151923", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }), fontSize: 14, lineHeight: 22 }, network: { flexDirection: "row", alignItems: "center", gap: 9 }, dot: { width: 9, height: 9, borderRadius: 99, backgroundColor: "#3457f1" },
  warning: { ...radius, borderRadius: 12, backgroundColor: "#fff4db", padding: 14 }, warningText: { color: "#7a4a00", fontSize: 14, fontWeight: "700" }, field: { gap: 8 }, label: { color: "#3d4655", fontSize: 13, fontWeight: "700" }, input: { minHeight: 52, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", color: "#151923", backgroundColor: "#fff", fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  button: { minHeight: Platform.OS === "android" ? 48 : 44, backgroundColor: "#3457f1", borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 12 }, buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" }, buttonInverted: { backgroundColor: "#fff", marginTop: 8 }, buttonTextInverted: { color: "#171b28" },
  outlineButton: { minHeight: Platform.OS === "android" ? 48 : 44, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 11 }, outlineText: { color: "#3457f1", fontSize: 15, fontWeight: "700" }, danger: { color: "#a32f24" },
  tabs: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e4e7ec", backgroundColor: "#fff", paddingHorizontal: 8, paddingTop: 7, paddingBottom: Platform.OS === "ios" ? 22 : 8 }, tab: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 10, borderCurve: "continuous" }, tabActive: { backgroundColor: "#eef1ff" }, tabIcon: { color: "#667085", fontSize: 18, fontWeight: "700" }, tabLabel: { color: "#667085", fontSize: 11, fontWeight: "600" }, blue: { color: "#3457f1" },
});
