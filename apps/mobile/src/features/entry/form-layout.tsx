import { Children, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Reveal } from "@/motion/reveal";
import { spacing } from "@/theme/theme";

type Props = { children: ReactNode; footer: ReactNode };

/** Fields that assemble one after another, above buttons that stay in reach. */
export function FormLayout({ children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.fields} keyboardShouldPersistTaps="handled">
        {Children.toArray(children).map((child, index) => (
          <Reveal key={index} index={index}>{child}</Reveal>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  fields: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xl },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
