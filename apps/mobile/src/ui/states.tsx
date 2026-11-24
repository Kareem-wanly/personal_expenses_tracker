import { StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { Reveal } from "@/motion/reveal";
import { Skeleton } from "@/motion/skeleton";
import { springs } from "@/motion/tokens";
import { spacing } from "@/theme/theme";

import { Button } from "./button";
import { Card } from "./card";
import { Text } from "./text";

/** The shape of a page while it loads. */
export function Loading() {
  return (
    <View style={styles.skeletons} accessibilityLabel="جارٍ التحميل">
      <Skeleton height={56} width="55%" />
      <Skeleton height={150} />
      <Skeleton height={120} />
      <Skeleton height={200} />
    </View>
  );
}

export function Failure({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Reveal>
      <Card>
        <Text variant="heading">تعذّر التحميل</Text>
        <Text color="muted">{error.message}</Text>
        <Button label="حاول من جديد" kind="plain" onPress={onRetry} />
      </Card>
    </Reveal>
  );
}

type EmptyProps = { icon: string; title: string; hint: string };

export function Empty({ icon, title, hint }: EmptyProps) {
  return (
    <Reveal style={styles.center}>
      <Animated.View entering={ZoomIn.springify().stiffness(springs.pop.stiffness).damping(springs.pop.damping)}>
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      <Text variant="heading">{title}</Text>
      <Text color="muted" style={styles.hint}>{hint}</Text>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  skeletons: { gap: spacing.lg },
  center: { paddingVertical: spacing.xxl * 2, alignItems: "center", gap: spacing.sm },
  icon: { fontSize: 44, lineHeight: 60 },
  hint: { textAlign: "center" },
});
