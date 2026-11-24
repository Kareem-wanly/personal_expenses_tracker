import { FREQUENCIES, type Frequency } from "@masrufi/core/enums";
import { FREQUENCY_LABELS } from "@masrufi/core/recurrence";

import { Collapse } from "@/motion/collapse";
import { Section } from "@/ui/section";
import { Segmented } from "@/ui/segmented";
import { Text } from "@/ui/text";

export type Repeat = "none" | Frequency;

const OPTIONS: { value: Repeat; label: string }[] = [
  { value: "none", label: "مرة واحدة" },
  ...FREQUENCIES.map((value) => ({ value, label: FREQUENCY_LABELS[value] })),
];

type Props = { value: Repeat; onChange: (value: Repeat) => void };

export function RepeatPicker(props: Props) {
  return (
    <Section title="التكرار">
      <Segmented label="التكرار" options={OPTIONS} {...props} />
      <Collapse open={props.value !== "none"}>
        <Text variant="small" color="muted">🔁 سيُضاف تلقائياً في موعده، ويمكنك إيقافه متى شئت.</Text>
      </Collapse>
    </Section>
  );
}
