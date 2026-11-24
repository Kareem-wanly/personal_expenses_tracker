import { StyleSheet, View, type ViewProps } from "react-native";

import { type Colors } from "@/theme/colors";
import { radius, spacing, useStyles } from "@/theme/theme";

export function Card({ style, ...props }: ViewProps) {
  const styles = useStyles(createStyles);
  return <View {...props} style={[styles.card, style]} />;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
    },
  });
