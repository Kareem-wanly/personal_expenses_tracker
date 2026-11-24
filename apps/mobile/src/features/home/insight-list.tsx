import type { Insight } from "@masrufi/contracts/api/responses";

import type { Colors } from "@/theme/colors";
import { Card } from "@/ui/card";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";

const toneColor: Record<Insight["tone"], keyof Colors> = {
  good: "positive",
  warn: "warning",
  bad: "negative",
  info: "text",
};

export function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <Section title="ملاحظات الشهر">
      {insights.map((insight) => (
        <Card key={insight.id}>
          <Text variant="strong" color={toneColor[insight.tone]}>{insight.title}</Text>
          <Text variant="small" color="muted">{insight.body}</Text>
        </Card>
      ))}
    </Section>
  );
}
