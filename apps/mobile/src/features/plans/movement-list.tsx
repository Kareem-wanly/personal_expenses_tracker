import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from "react-native-reanimated";

import type { Movement } from "@masrufi/contracts/api/responses";
import { formatShortDate } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";

import { durations } from "@/motion/tokens";
import { spacing } from "@/theme/theme";
import { Card } from "@/ui/card";
import { IconButton } from "@/ui/icon-button";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";

type Props = {
  title: string;
  movements: Movement[];
  currency: string;
  signed?: boolean;
  busy: boolean;
  onDelete: (id: string) => void;
};

/** Payments of a debt, or deposits and withdrawals of a goal. */
export function MovementList({ title, movements, currency, signed = false, busy, onDelete }: Props) {
  if (movements.length === 0) return null;
  return (
    <Section title={title}>
      <Card>
        {movements.map(({ id, amount, date, note }) => (
          <Animated.View
            key={id}
            entering={FadeInDown.duration(durations.normal)}
            exiting={FadeOutLeft.duration(durations.fast)}
            layout={LinearTransition.duration(durations.normal)}
            style={styles.row}
          >
            <View style={styles.texts}>
              <Text variant="strong" color={!signed ? "text" : amount < 0 ? "negative" : "positive"}>
                {formatMoney(amount, currency)}
              </Text>
              <Text variant="small" color="muted">
                {[formatShortDate(date), note].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <IconButton label="حذف" icon="trash" color="negative" disabled={busy} onPress={() => onDelete(id)} />
          </Animated.View>
        ))}
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs },
  texts: { flex: 1 },
});
