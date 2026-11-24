import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";

import { spacing } from "@/theme/theme";

import { durations, easeOut } from "./tokens";

type Props = { id: string; children: ReactNode };

/** Replaces its content softly whenever `id` changes (another month, another list). */
export function Swap({ id, children }: Props) {
  return (
    <Animated.View
      key={id}
      entering={FadeInDown.duration(durations.normal).easing(easeOut)}
      exiting={FadeOut.duration(120)}
      style={styles.content}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xl } });
