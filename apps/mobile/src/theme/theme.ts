import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { type Colors, palettes } from "./colors";

export function useColors(): Colors {
  return useColorScheme() === "dark" ? palettes.dark : palettes.light;
}

/** Styles that follow light and dark mode: `const styles = useStyles(createStyles)`. */
export function useStyles<T>(create: (colors: Colors) => T): T {
  const colors = useColors();
  return useMemo(() => create(colors), [create, colors]);
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { md: 12, lg: 18, full: 999 };

export const fonts = {
  text: "NotoNaskhArabic_400Regular",
  bold: "NotoNaskhArabic_600SemiBold",
  display: "ElMessiri_600SemiBold",
};
