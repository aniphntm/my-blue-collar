import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export function Screen({ children, modal = false }: { children: React.ReactNode; modal?: boolean }) {
  return <ScrollView contentContainerStyle={[styles.screen, modal && styles.modal]} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}
export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>{children}</View>;
}
export function Chip() { return <View style={styles.chip}><Text style={styles.chipText}>Testnet</Text></View>; }
export function TestnetNote() {
  return <View style={styles.warning}><Text style={styles.warningText}>Sepolia testnet · test ETH has no real funds</Text></View>;
}
export function Field({ label, placeholder, value, onChange, decimal = false }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; decimal?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} inputMode={decimal ? "decimal" : "text"} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#7b8495" style={styles.input} value={value} /></View>;
}
export function Button({ label, onPress, inverted = false }: { label: string; onPress: () => void; inverted?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, inverted && styles.buttonInverted]}><Text style={[styles.buttonText, inverted && styles.buttonTextInverted]}>{label}</Text></Pressable>;
}
export function OutlineButton({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.outlineButton}><Text style={[styles.outlineText, danger && styles.danger]}>{label}</Text></Pressable>;
}

const radius = { borderRadius: 16, borderCurve: "continuous" as const };
export const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 36, gap: 18 }, modal: { paddingTop: Platform.OS === "ios" ? 42 : 24 }, grow: { flex: 1 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12 }, eyebrow: { color: "#667085", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 }, heading: { color: "#151923", fontSize: 30, fontWeight: "700", letterSpacing: -0.7 },
  chip: { ...radius, borderRadius: 999, backgroundColor: "#fff4db", paddingHorizontal: 12, paddingVertical: 7 }, chipText: { color: "#a36100", fontSize: 12, fontWeight: "700" },
  hero: { ...radius, borderRadius: 18, backgroundColor: "#171b28", padding: 24, gap: 14 }, darkMuted: { color: "#bfc7d7", fontSize: 15, lineHeight: 22 }, loader: { alignSelf: "flex-start" }, amount: { color: "#fff", fontSize: 46, fontWeight: "700", letterSpacing: -2.3 },
  card: { ...radius, backgroundColor: "#fff", borderColor: "#e3e7ed", borderWidth: 1, padding: 20, gap: 14 }, cardTitle: { color: "#151923", fontSize: 17, fontWeight: "700" }, body: { color: "#667085", fontSize: 15, lineHeight: 23 }, center: { color: "#667085", fontSize: 15, lineHeight: 23, textAlign: "center" },
  error: { ...radius, backgroundColor: "#fff5f3", borderColor: "#f4c7c0", borderWidth: 1, padding: 20, gap: 12 }, errorTitle: { color: "#9f2d20", fontSize: 17, fontWeight: "700" },
  notice: { ...radius, backgroundColor: "#fff4db", borderColor: "#f0d9a3", borderWidth: 1, padding: 20, gap: 12 }, noticeTitle: { color: "#7a4a00", fontSize: 17, fontWeight: "700" },
  empty: { ...radius, backgroundColor: "#fff", borderColor: "#e3e7ed", borderWidth: 1, padding: 28, gap: 14, alignItems: "center" }, emptyIcon: { color: "#3457f1", fontSize: 32 },
  address: { color: "#151923", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }), fontSize: 14, lineHeight: 22 }, network: { flexDirection: "row", alignItems: "center", gap: 9 }, dot: { width: 9, height: 9, borderRadius: 99, backgroundColor: "#3457f1" },
  warning: { ...radius, borderRadius: 12, backgroundColor: "#fff4db", padding: 14 }, warningText: { color: "#7a4a00", fontSize: 14, fontWeight: "700" }, field: { gap: 8 }, label: { color: "#3d4655", fontSize: 13, fontWeight: "700" }, input: { minHeight: 52, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", color: "#151923", backgroundColor: "#fff", fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  button: { minHeight: Platform.OS === "android" ? 48 : 44, backgroundColor: "#3457f1", borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 12 }, buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" }, buttonInverted: { backgroundColor: "#fff", marginTop: 8 }, buttonTextInverted: { color: "#171b28" },
  outlineButton: { minHeight: Platform.OS === "android" ? 48 : 44, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 11 }, outlineText: { color: "#3457f1", fontSize: 15, fontWeight: "700" }, danger: { color: "#a32f24" },
});
