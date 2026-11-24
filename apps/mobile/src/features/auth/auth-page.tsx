import { Children, type ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { Reveal } from "@/motion/reveal";
import { useShake } from "@/motion/use-shake";
import { spacing } from "@/theme/theme";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

type Props = { title: string; hint: string; error?: string; children: ReactNode };

/** The frame shared by the screens shown before signing in; shakes when refused. */
export function AuthPage({ title, hint, error, children }: Props) {
  const { shake, style } = useShake();
  useEffect(() => {
    if (error) shake();
  }, [error, shake]);

  return (
    <Screen>
      <View style={styles.page}>
        <Reveal>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          <Text color="muted">{hint}</Text>
        </Reveal>
        <Animated.View style={[styles.fields, style]}>
          {Children.toArray(children).map((child, index) => (
            <Reveal key={index} index={index + 1}>{child}</Reveal>
          ))}
        </Animated.View>
        {error ? (
          <Reveal>
            <Text color="negative" accessibilityRole="alert">{error}</Text>
          </Reveal>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", gap: spacing.lg, maxWidth: 420, width: "100%", alignSelf: "center" },
  fields: { gap: spacing.lg },
});
