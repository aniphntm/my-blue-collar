import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "./tokens";

export function Field({ label, placeholder, value, onChange, decimal = false }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; decimal?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} inputMode={decimal ? "decimal" : "text"} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#7b8495" style={styles.input} value={value} /></View>;
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: "#3d4655", fontSize: 13, fontWeight: "700" },
  input: { minHeight: 52, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, borderCurve: "continuous", color: colors.ink, backgroundColor: colors.surface, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
});
