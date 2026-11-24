import { Pressable, StyleSheet, View } from "react-native";

import { formatMonthLabel, shiftMonth } from "@masrufi/core/dates";

import { spacing, useColors } from "@/theme/theme";

import { Icon, type IconName } from "./icon";
import { Text } from "./text";

type Props = { month: string; onChange: (month: string) => void };

export function MonthSwitcher({ month, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Arrow label="الشهر السابق" icon="chevronRight" onPress={() => onChange(shiftMonth(month, -1))} />
      <Text variant="heading">{formatMonthLabel(month)}</Text>
      <Arrow label="الشهر التالي" icon="chevronLeft" onPress={() => onChange(shiftMonth(month, 1))} />
    </View>
  );
}

type ArrowProps = { label: string; icon: IconName; onPress: () => void };

function Arrow({ label, icon, onPress }: ArrowProps) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={10} style={styles.arrow}>
      <Icon name={icon} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  arrow: { paddingHorizontal: spacing.md },
});
