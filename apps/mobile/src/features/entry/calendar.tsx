import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { daysInMonth, formatDayLabel, monthOf, parseISODate } from "@masrufi/core/dates";

import { PressableScale } from "@/motion/pressable-scale";
import { durations } from "@/motion/tokens";
import { radius, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { MonthSwitcher } from "@/ui/month-switcher";
import { Text } from "@/ui/text";

/** Weeks start on Saturday. */
const WEEKDAYS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

type Props = { value: string; onChange: (day: string) => void };

export function Calendar({ value, onChange }: Props) {
  const colors = useColors();
  const [month, setMonth] = useState(monthOf(value));
  const blanks = (parseISODate(`${month}-01`).getDay() + 1) % 7;
  const days = Array.from(
    { length: daysInMonth(month) },
    (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
  );

  return (
    <Card>
      <MonthSwitcher month={month} onChange={setMonth} />
      <Animated.View key={month} entering={FadeIn.duration(durations.normal)} style={styles.grid}>
        {WEEKDAYS.map((name) => (
          <Text key={name} variant="small" color="muted" style={styles.weekday}>{name}</Text>
        ))}
        {Array.from({ length: blanks }, (_, index) => (
          <View key={index} style={styles.cell} />
        ))}
        {days.map((day) => {
          const selected = day === value;
          return (
            <PressableScale
              to={0.8}
              key={day}
              accessibilityRole="button"
              accessibilityLabel={formatDayLabel(day, "")}
              accessibilityState={{ selected }}
              onPress={() => onChange(day)}
              style={[styles.cell, selected && { backgroundColor: colors.ink }]}
            >
              <Text color={selected ? "onInk" : "text"}>{Number(day.slice(8))}</Text>
            </PressableScale>
          );
        })}
      </Animated.View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  weekday: { width: `${100 / 7}%`, textAlign: "center" },
  cell: { width: `${100 / 7}%`, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.md },
});
