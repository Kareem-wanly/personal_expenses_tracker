import { StyleSheet, View } from "react-native";

import { SheetBody } from "@/features/plans/sheet-body";
import type { SheetProps } from "@/features/sheets/registry";
import { Reveal } from "@/motion/reveal";
import { fonts, spacing } from "@/theme/theme";
import { Button } from "@/ui/button";
import { Text } from "@/ui/text";

import { RELEASES } from "./releases";

export function WhatsNew({ close }: SheetProps) {
  const [latest] = RELEASES;
  return (
    <SheetBody>
      <Reveal>
        <Text variant="small" color="muted">ما الجديد · {latest.version}</Text>
        <Text variant="title">{latest.title}</Text>
      </Reveal>
      {latest.items.map(({ title, body }, index) => (
        <Reveal key={title} index={index + 1} style={styles.item}>
          <Text color="accent" style={styles.number}>{String(index + 1).padStart(2, "0")}</Text>
          <View style={styles.texts}>
            <Text variant="strong">{title}</Text>
            <Text color="muted">{body}</Text>
          </View>
        </Reveal>
      ))}
      <Button label="متابعة" onPress={close} />
    </SheetBody>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", gap: spacing.md },
  number: { fontFamily: fonts.display, fontSize: 16 },
  texts: { flex: 1 },
});
