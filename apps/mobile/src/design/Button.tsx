import { Pressable, StyleSheet, Text } from "react-native";
import { colors, minTarget } from "./tokens";

export function Button({ label, onPress, inverted = false }: { label: string; onPress: () => void; inverted?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, inverted && styles.buttonInverted]}><Text style={[styles.buttonText, inverted && styles.buttonTextInverted]}>{label}</Text></Pressable>;
}

export function OutlineButton({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.outlineButton}><Text style={[styles.outlineText, danger && styles.danger]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: minTarget, backgroundColor: colors.primary, borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 12 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  buttonInverted: { backgroundColor: colors.surface, marginTop: 8 },
  buttonTextInverted: { color: colors.inkDark },
  outlineButton: { minHeight: minTarget, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center", padding: 11 },
  outlineText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  danger: { color: "#a32f24" },
});
