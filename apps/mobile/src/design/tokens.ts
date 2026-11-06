import { Platform } from "react-native";

export const colors = {
  background: "#f7f8fb",
  surface: "#ffffff",
  ink: "#151923",
  inkDark: "#171b28",
  primary: "#3457f1",
  errorBg: "#fff5f3",
  errorText: "#9f2d20",
  warnBg: "#fff4db",
  warnText: "#7a4a00",
} as const;

export const radius = { borderRadius: 16, borderCurve: "continuous" as const };

/** Minimum touch target: 44pt on iOS, 48dp on Android. */
export const minTarget = Platform.OS === "android" ? 48 : 44;
