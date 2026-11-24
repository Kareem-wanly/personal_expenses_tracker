import { StyleSheet, View } from "react-native";

import type { Insight } from "@masrufi/contracts/api/responses";

import { Reveal } from "@/motion/reveal";
import type { Colors } from "@/theme/colors";
import { fonts, spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";

const toneColor: Record<Insight["tone"], keyof Colors> = {
  good: "positive",
  warn: "warning",
  bad: "negative",
  info: "muted",
};

/** Numbered notes; the rule at the edge says whether one is good or a warning. */
export function InsightList({ insights }: { insights: Insight[] }) {
  const colors = useColors();
  return (
    <Reveal>
      <Section title="ملاحظات الشهر">
        <Card>
          {insights.map(({ id, tone, title, body }, index) => (
            <Reveal key={id} index={index + 1} style={styles.note}>
              <View style={[styles.rule, { backgroundColor: colors[toneColor[tone]] }]} />
              <Text color="muted" style={styles.number}>{String(index + 1).padStart(2, "0")}</Text>
              <View style={styles.texts}>
                <Text variant="strong">{title}</Text>
                <Text variant="small" color="muted">{body}</Text>
              </View>
            </Reveal>
          ))}
        </Card>
      </Section>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  rule: { width: 3, borderRadius: 2 },
  number: { fontFamily: fonts.display, fontSize: 14 },
  texts: { flex: 1 },
});
