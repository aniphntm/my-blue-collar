import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "./tokens";

export function Chip() {
  return <View style={styles.chip}><Text style={styles.chipText}>Sandbox</Text></View>;
}

const styles = StyleSheet.create({
  chip: { ...radius, borderRadius: 999, backgroundColor: colors.warnBg, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { color: "#a36100", fontSize: 12, fontWeight: "700" },
});
