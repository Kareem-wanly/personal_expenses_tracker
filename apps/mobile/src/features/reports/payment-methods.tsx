import { StyleSheet, View } from "react-native";

import type { Report } from "@masrufi/contracts/api/responses";
import { PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";
import { formatMoney, formatPercent } from "@masrufi/core/money";

import { spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Meter } from "@/ui/meter";
import { Text } from "@/ui/text";

type Props = { methods: Report["byMethod"]; total: number; currency: string };

export function PaymentMethods({ methods, total, currency }: Props) {
  const colors = useColors();
  return (
    <Card>
      {methods.map((item, index) => (
        <View key={item.method} style={styles.method}>
          <View style={styles.line}>
            <Text style={styles.name}>{PAYMENT_METHOD_LABELS[item.method]}</Text>
            <Text variant="small" color="muted">{formatPercent(item.total / total)}</Text>
            <Text variant="strong">{formatMoney(item.total, currency)}</Text>
          </View>
          <Meter ratio={item.total / total} color={colors.ink} delay={index * 120} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  method: { gap: spacing.xs, paddingVertical: spacing.xs },
  line: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  name: { flex: 1 },
});
