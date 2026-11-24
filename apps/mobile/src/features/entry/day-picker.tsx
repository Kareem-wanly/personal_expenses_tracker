import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { addDays, formatDayLabel } from "@masrufi/core/dates";

import { Collapse } from "@/motion/collapse";
import { spacing } from "@/theme/theme";
import { Chip } from "@/ui/chip";

import { Calendar } from "./calendar";

type Props = { value: string; today: string; onChange: (day: string) => void };

export function DayPicker({ value, today, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const yesterday = addDays(today, -1);
  const other = value !== today && value !== yesterday;

  function choose(day: string) {
    setOpen(false);
    onChange(day);
  }

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Chip label="اليوم" selected={value === today} onPress={() => choose(today)} />
        <Chip label="أمس" selected={value === yesterday} onPress={() => choose(yesterday)} />
        <Chip
          label={other ? formatDayLabel(value, today) : "يوم آخر"}
          selected={other}
          onPress={() => setOpen(!open)}
        />
      </View>
      <Collapse open={open}>
        <Calendar value={value} onChange={choose} />
      </Collapse>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
});
