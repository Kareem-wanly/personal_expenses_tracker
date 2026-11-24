import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { formatDayLabel } from "@masrufi/core/dates";

import { Calendar } from "@/features/entry/calendar";
import { Collapse } from "@/motion/collapse";
import { spacing } from "@/theme/theme";
import { Chip } from "@/ui/chip";

type Props = { value: string | null; today: string; none: string; onChange: (day: string | null) => void };

/** A day that may be left out. */
export function OptionalDay({ value, today, none, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Chip
          label={none}
          selected={value === null}
          onPress={() => {
            setOpen(false);
            onChange(null);
          }}
        />
        <Chip label={value ? formatDayLabel(value, today) : "اختر يوماً"} selected={value !== null} onPress={() => setOpen(!open)} />
      </View>
      <Collapse open={open}>
        <Calendar
          value={value ?? today}
          onChange={(day) => {
            setOpen(false);
            onChange(day);
          }}
        />
      </Collapse>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
});
