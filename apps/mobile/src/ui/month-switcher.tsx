import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";

import { formatMonthLabel, shiftMonth } from "@masrufi/core/dates";

import { PressableScale } from "@/motion/pressable-scale";
import { durations } from "@/motion/tokens";
import { spacing, useColors } from "@/theme/theme";

import { Icon, type IconName } from "./icon";
import { Text } from "./text";

type Props = { month: string; onChange: (month: string) => void };

/** The month's name slides in from the side it comes from. */
export function MonthSwitcher({ month, onChange }: Props) {
  const [forward, setForward] = useState(true);
  const entering = forward ? FadeInLeft : FadeInRight;
  const go = (delta: 1 | -1) => {
    setForward(delta === 1);
    onChange(shiftMonth(month, delta));
  };
  return (
    <View style={styles.row}>
      <Arrow label="الشهر السابق" icon="chevronRight" onPress={() => go(-1)} />
      <Animated.View key={month} entering={entering.duration(durations.normal)}>
        <Text variant="heading">{formatMonthLabel(month)}</Text>
      </Animated.View>
      <Arrow label="الشهر التالي" icon="chevronLeft" onPress={() => go(1)} />
    </View>
  );
}

type ArrowProps = { label: string; icon: IconName; onPress: () => void };

function Arrow({ label, icon, onPress }: ArrowProps) {
  const colors = useColors();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} to={0.8} hitSlop={10} style={styles.arrow}>
      <Icon name={icon} color={colors.accent} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  arrow: { padding: spacing.md },
});
