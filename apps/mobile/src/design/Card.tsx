import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "./tokens";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  card: { ...radius, backgroundColor: colors.surface, borderColor: "#e3e7ed", borderWidth: 1, padding: 20, gap: 14 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: "700" },
});
