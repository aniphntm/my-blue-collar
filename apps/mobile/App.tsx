import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  buildSepoliaTransferUri, fetchSepoliaBalance, formatEth, isEthereumAddress,
} from "./src/ethereum";
import { Activity } from "./src/screens/Activity";
import { Home } from "./src/screens/Home";
import type { Balance, WalletSessionView } from "./src/screens/types";
import { Button, Field, OutlineButton, Screen, styles as ui } from "./src/screens/ui";
import { Wallet } from "./src/screens/Wallet";

type Tab = "Home" | "Activity" | "Wallet";
const tabs: Array<{ key: Tab; icon: string }> = [
  { key: "Home", icon: "⌂" }, { key: "Activity", icon: "↕" }, { key: "Wallet", icon: "◇" },
];

// Local adapter: swap this body for the Reown-backed `useWalletSession` once it lands.
// Until then no real session exists, so connecting reports an honest error.
function useWalletSessionView(): WalletSessionView {
  const [state, setState] = useState<Pick<WalletSessionView, "status" | "error">>({ status: "disconnected" });
  return {
    ...state,
    connect: () => setState({ status: "error", error: "Wallet connection is not available in this build yet." }),
    disconnect: () => setState({ status: "disconnected" }),
    switchToSepolia: () => setState({ status: "error", error: "Network switching is not available in this build yet." }),
  };
}

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const session = useWalletSessionView();
  const [balance, setBalance] = useState<Balance>({ kind: "idle" });
  const [sendOpen, setSendOpen] = useState(false);
  const address = session.status === "connected" ? session.address : undefined;

  const latest = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++latest.current; // ignore responses from superseded requests
    if (!address || !isEthereumAddress(address)) { setBalance({ kind: "idle" }); return; }
    setBalance({ kind: "loading" });
    try {
      const wei = await fetchSepoliaBalance(address);
      if (id === latest.current) setBalance({ kind: "ready", wei });
    } catch (error) {
      if (id === latest.current) setBalance({ kind: "error", message: error instanceof Error ? error.message : "Sepolia is unavailable." });
    }
  }, [address]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (session.status !== "connected") setSendOpen(false); }, [session.status]);

  useEffect(() => {
    if (balance.kind === "error") AccessibilityInfo.announceForAccessibility(balance.message);
  }, [balance]);

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.banner}><Text style={styles.bannerText}>ETHEREUM SEPOLIA · TESTNET · NO REAL FUNDS</Text></View>
      <View style={styles.content}>
        {tab === "Home" && <Home session={session} balance={balance} onRefresh={() => void refresh()} onSend={() => setSendOpen(true)} />}
        {tab === "Activity" && <Activity session={session} />}
        {tab === "Wallet" && <Wallet session={session} />}
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map(({ key, icon }) => {
          const selected = tab === key;
          return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={key} onPress={() => setTab(key)} style={[styles.tab, selected && styles.tabActive]}>
            <Text style={[styles.tabIcon, selected && styles.blue]}>{icon}</Text><Text style={[styles.tabLabel, selected && styles.blue]}>{key}</Text>
          </Pressable>;
        })}
      </View>
      <SendModal balance={balance.kind === "ready" ? balance.wei : null} open={sendOpen} onClose={() => setSendOpen(false)} />
    </View>
  );
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
  return <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={open}><Screen modal><Text style={ui.eyebrow}>SEPOLIA TEST TRANSACTION</Text><Text style={ui.heading}>Send test ETH</Text><View style={ui.warning}><Text style={ui.warningText}>Testnet only. Sepolia ETH is not real money.</Text></View><Field label="Recipient public address" placeholder="0x…" value={recipient} onChange={setRecipient} /><Field decimal label="Amount in ETH" placeholder="0.001" value={amount} onChange={setAmount} /><Text style={ui.body}>Available: {balance === null ? "unknown" : `${formatEth(balance)} ETH`}. Your external wallet calculates fees and asks for final approval.</Text><Button label="Continue in external wallet" onPress={() => void send()} /><OutlineButton label="Cancel" onPress={onClose} /></Screen></Modal>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: "#f7f8fb" }, content: { flex: 1 },
  banner: { minHeight: Platform.OS === "ios" ? 50 : 36, paddingTop: Platform.OS === "ios" ? 18 : 6, paddingHorizontal: 12, backgroundColor: "#fff4db", justifyContent: "center" },
  bannerText: { color: "#7a4a00", fontSize: 11, fontWeight: "700", letterSpacing: 0.7, textAlign: "center" },
  tabs: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e4e7ec", backgroundColor: "#fff", paddingHorizontal: 8, paddingTop: 7, paddingBottom: Platform.OS === "ios" ? 22 : 8 }, tab: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 10, borderCurve: "continuous" }, tabActive: { backgroundColor: "#eef1ff" }, tabIcon: { color: "#667085", fontSize: 18, fontWeight: "700" }, tabLabel: { color: "#667085", fontSize: 11, fontWeight: "600" }, blue: { color: "#3457f1" },
});
