import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/motion/pressable-scale";
import type { Colors } from "@/theme/colors";
import { radius, spacing, useColors } from "@/theme/theme";

import { Icon, type IconName } from "./icon";
import { Text } from "./text";

type GroupProps = { title?: string; footer?: string; children: ReactNode };

/** Settings rows in one card, with lines between them. */
export function Group({ title, footer, children }: GroupProps) {
  const colors = useColors();
  return (
    <View style={styles.group}>
      {title ? <Text variant="small" color="muted">{title}</Text> : null}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.hairline }]}>
        {Children.toArray(children).map((child, index) => (
          <View key={index} style={index > 0 ? [styles.divided, { borderColor: colors.hairline }] : null}>
            {child}
          </View>
        ))}
      </View>
      {footer ? <Text variant="small" color="muted">{footer}</Text> : null}
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Instead of a drawn icon. */
  emoji?: string;
  color?: keyof Colors;
  /** What sits at the end: a value, a switch… */
  trailing?: ReactNode;
  faded?: boolean;
  onPress?: () => void;
};

export function Row({ title, subtitle, icon, emoji, color = "text", trailing, faded, onPress }: RowProps) {
  const colors = useColors();
  const content = (
    <View style={[styles.row, faded && styles.faded]}>
      {icon ? <Icon name={icon} color={colors[color]} size={21} /> : null}
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <View style={styles.texts}>
        <Text color={color} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="small" color="muted">{subtitle}</Text> : null}
      </View>
      {typeof trailing === "string" ? <Text color="muted">{trailing}</Text> : trailing}
      {onPress ? <Icon name="chevronLeft" color={colors.muted} size={18} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={title} to={0.98} onPress={onPress}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  card: { borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" },
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  faded: { opacity: 0.55 },
  emoji: { fontSize: 20, lineHeight: 30 },
  texts: { flex: 1 },
});
