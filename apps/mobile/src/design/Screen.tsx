import type { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";

export function Screen({ children, modal = false }: { children: ReactNode; modal?: boolean }) {
  return <ScrollView contentContainerStyle={[styles.screen, modal && styles.modal]} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 36, gap: 18 },
  modal: { paddingTop: Platform.OS === "ios" ? 42 : 24 },
});
