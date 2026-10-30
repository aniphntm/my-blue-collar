import { useEffect, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { SEPOLIA, formatEth, shortenAddress } from "../ethereum";
import { useSendFlow } from "./useSendFlow";
import { explorerTxUrl, feeWithHeadroom } from "./validation";
import type { SendWalletSession } from "./types";

type Props = { session: SendWalletSession; open: boolean; onClose: () => void; onSettled?: () => void };

/** Send test ETH: recipient -> amount -> review -> wallet approval -> submitted/pending/confirmed/failed. */
export function SendFlow({ session, open, onClose, onSettled }: Props) {
  const flow = useSendFlow(session);
  const s = flow.state;
  const locked = s.phase === "approving" || s.phase === "preparing";

  useEffect(() => {
    if (s.phase === "confirmed" || s.phase === "reverted" || s.phase === "dropped") onSettled?.();
    const spoken = announce(s);
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
  }, [s.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { flow.reset(); onClose(); };

  return <Modal animationType="slide" onRequestClose={locked ? () => {} : close} presentationStyle="pageSheet" visible={open}>
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>SEPOLIA TEST TRANSACTION</Text>
      <Text accessibilityRole="header" style={styles.heading}>Send test ETH</Text>
      <View style={styles.warning}><Text style={styles.warningText}>Testnet only. No real funds. Sepolia ETH has no monetary value, and this is not a payment to a supplier or in any currency.</Text></View>

      {(s.phase === "editing" || s.phase === "preparing") && <>
        <Field label="Recipient public address" placeholder="0x…" value={s.recipient} editable={s.phase === "editing"} error={s.phase === "editing" ? s.recipientError : null} onChange={(v) => flow.edit("recipient", v)} />
        <Field decimal label="Amount in ETH" placeholder="0.001" value={s.amount} editable={s.phase === "editing"} error={s.phase === "editing" ? s.amountError : null} onChange={(v) => flow.edit("amount", v)} />
        {s.phase === "editing" && s.notice && <Notice tone="error" title="Could not prepare">{s.notice}</Notice>}
        <Button busy={s.phase === "preparing"} disabled={s.phase === "preparing"} label={s.phase === "preparing" ? "Checking balance and fee…" : "Review"} onPress={() => void flow.next()} />
        <Outline label="Cancel" onPress={close} disabled={s.phase === "preparing"} />
      </>}

      {(s.phase === "review" || s.phase === "approving") && <>
        <Row label="Network" value={`${SEPOLIA.name} (chain ${SEPOLIA.chainId}) · testnet`} />
        <Row label="From" value={shortenAddress(s.draft.from)} />
        <Row label="Recipient" value={s.draft.to} mono />
        <Row label="Amount" value={`${formatEth(s.draft.valueWei)} ETH (test)`} />
        <Row label="Estimated network fee" value={`${formatEth(s.fee.feeWei)} ETH (test), up to ${formatEth(feeWithHeadroom(s.fee.feeWei))} with headroom`} />
        <Row label="Your balance" value={`${formatEth(s.balanceWei)} ETH (test)`} />
        {s.phase === "review" && s.error && <Notice tone="error" title="Cannot send">{s.error}</Notice>}
        {s.phase === "approving" && <Notice tone="info" title="Waiting for your wallet"><View style={styles.inline}><ActivityIndicator /><Text style={styles.body}>Approve the request in your external wallet. Do not tap again.</Text></View></Notice>}
        <Button busy={s.phase === "approving"} disabled={s.phase === "approving" || (s.phase === "review" && !!s.error)} label={s.phase === "approving" ? "Waiting for approval…" : "Approve in wallet"} onPress={() => void flow.approve()} />
        <Outline label="Edit details" onPress={flow.back} disabled={s.phase === "approving"} />
      </>}

      {(s.phase === "submitted" || s.phase === "pending") && <>
        <Notice tone="info" title={s.phase === "submitted" ? "Submitted" : "Pending"}>
          <Text style={styles.body}>{s.phase === "submitted" ? "Your wallet broadcast this test transaction. Waiting for the first network check." : "Waiting for Sepolia to include the transaction. This can take a minute."}</Text>
          {s.pollNote && <Text style={styles.body}>Status check failed ({s.pollNote}). Still trying; the transaction may still succeed.</Text>}
        </Notice>
        <HashBlock hash={s.hash} />
        <Outline label="Close (the transaction stays on the network)" onPress={onClose} />
      </>}

      {s.phase === "confirmed" && <>
        <Notice tone="success" title="✓ Confirmed on Sepolia">
          <Text style={styles.body}>{formatEth(s.draft.valueWei)} test ETH was included in block {s.blockNumber.toString()}. This is a testnet confirmation only. It is not a payment to a supplier and moves no real money.</Text>
        </Notice>
        <HashBlock hash={s.hash} />
        <Button label="Done" onPress={close} />
      </>}

      {s.phase === "reverted" && <>
        <Notice tone="error" title="✕ Reverted">
          <Text style={styles.body}>The transaction was included in block {s.blockNumber.toString()} but failed on-chain. The amount was not transferred, though a test-ETH fee was spent.</Text>
        </Notice>
        <HashBlock hash={s.hash} />
        <Button label="Start over" onPress={flow.reset} />
        <Outline label="Close" onPress={close} />
      </>}

      {s.phase === "dropped" && <>
        <Notice tone="error" title="✕ Dropped">
          <Text style={styles.body}>Sepolia has not seen this transaction for several minutes, so it was probably dropped or replaced. It could still appear late, so check the explorer before sending again.</Text>
        </Notice>
        <HashBlock hash={s.hash} />
        <Button label="Start over" onPress={flow.reset} />
        <Outline label="Close" onPress={close} />
      </>}

      {s.phase === "failed" && <>
        <Notice tone="error" title={`✕ ${failureTitle(s.kind)}`}><Text style={styles.body}>{s.message}</Text></Notice>
        {s.back && <Button label="Back to review" onPress={flow.back} />}
        <Outline label={s.back ? "Cancel" : "Close"} onPress={close} />
      </>}
    </ScrollView>
  </Modal>;
}

function failureTitle(kind: string): string {
  return kind === "rejected" ? "Rejected in wallet" : kind === "wrong_chain" ? "Wrong network" : kind === "rpc" ? "Network unavailable" : "Could not send";
}
function announce(s: ReturnType<typeof useSendFlow>["state"]): string | null {
  switch (s.phase) {
    case "submitted": return "Test transaction submitted.";
    case "confirmed": return "Test transaction confirmed on Sepolia.";
    case "reverted": return "Test transaction reverted.";
    case "dropped": return "Test transaction dropped.";
    case "failed": return `${failureTitle(s.kind)}. ${s.message}`;
    default: return null;
  }
}

function HashBlock({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const clip = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } }).navigator?.clipboard;
  const copy = async () => {
    try {
      if (clip) { await clip.writeText(hash); setCopied(true); AccessibilityInfo.announceForAccessibility("Transaction hash copied"); }
      else await Share.share({ message: hash }); // no clipboard module in this build: the share sheet offers Copy
    } catch { /* user dismissed */ }
  };
  return <View style={styles.card}>
    <Text style={styles.label}>Transaction hash</Text>
    <Text selectable style={styles.mono}>{hash}</Text>
    <Outline label={copied ? "Copied ✓" : clip ? "Copy hash" : "Share or copy hash"} onPress={() => void copy()} />
    <Outline label="View on Sepolia explorer" onPress={() => void Linking.openURL(explorerTxUrl(hash))} />
  </View>;
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}><Text style={styles.label}>{label}</Text><Text style={mono ? styles.mono : styles.value}>{value}</Text></View>;
}
function Notice({ tone, title, children }: { tone: "info" | "error" | "success"; title: string; children: React.ReactNode }) {
  return <View accessibilityLiveRegion="polite" style={[styles.notice, tone === "error" && styles.noticeError, tone === "success" && styles.noticeSuccess]}><Text style={styles.noticeTitle}>{title}</Text>{typeof children === "string" ? <Text style={styles.body}>{children}</Text> : children}</View>;
}
function Field({ label, placeholder, value, onChange, error, editable, decimal = false }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; error: string | null; editable: boolean; decimal?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} editable={editable} inputMode={decimal ? "decimal" : "text"} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#7b8495" style={[styles.input, !!error && styles.inputError]} value={value} />
    {error && <Text accessibilityLiveRegion="polite" style={styles.errorText}>✕ {error}</Text>}
  </View>;
}
function Button({ label, onPress, disabled = false, busy = false }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
function Outline({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.outline, disabled && styles.disabled]}><Text style={styles.outlineText}>{label}</Text></Pressable>;
}

const minH = Platform.OS === "android" ? 48 : 44;
const styles = StyleSheet.create({
  screen: { padding: 20, paddingTop: Platform.OS === "ios" ? 42 : 24, paddingBottom: 36, gap: 16 },
  eyebrow: { color: "#7b8495", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  heading: { color: "#151923", fontSize: 30, fontWeight: "700", letterSpacing: -0.7 },
  warning: { borderRadius: 12, borderCurve: "continuous", backgroundColor: "#fff4db", padding: 14 },
  warningText: { color: "#7a4a00", fontSize: 14, fontWeight: "700", lineHeight: 20 },
  field: { gap: 8 }, label: { color: "#3d4655", fontSize: 13, fontWeight: "700" },
  input: { minHeight: 52, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", color: "#151923", backgroundColor: "#fff", fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  inputError: { borderColor: "#a32f24", borderWidth: 2 }, errorText: { color: "#9f2d20", fontSize: 14, lineHeight: 20 },
  row: { gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e3e7ed" },
  value: { color: "#151923", fontSize: 16, lineHeight: 22 },
  mono: { color: "#151923", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 14, lineHeight: 22 },
  body: { color: "#475467", fontSize: 15, lineHeight: 23 }, inline: { flexDirection: "row", alignItems: "center", gap: 10 },
  notice: { borderRadius: 14, borderCurve: "continuous", backgroundColor: "#eef1ff", borderWidth: 1, borderColor: "#c7d0f8", padding: 16, gap: 8 },
  noticeError: { backgroundColor: "#fff5f3", borderColor: "#f4c7c0" }, noticeSuccess: { backgroundColor: "#effaf2", borderColor: "#b7e2c3" },
  noticeTitle: { color: "#151923", fontSize: 17, fontWeight: "700" },
  card: { borderRadius: 14, borderCurve: "continuous", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e3e7ed", padding: 16, gap: 12 },
  button: { minHeight: minH, backgroundColor: "#3457f1", borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 12 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  outline: { minHeight: minH, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 11 },
  outlineText: { color: "#2b47c9", fontSize: 15, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.5 },
});
