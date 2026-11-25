import { StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from "react-native-reanimated";

import { usePendingWrites } from "@/api/use-pending-writes";
import { useOnline } from "@/api/use-online";
import { durations } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

function describe(online: boolean, waiting: number): string | null {
  const count = waiting === 1 ? "عملية واحدة" : waiting === 2 ? "عمليتان" : `${waiting} عمليات`;
  if (!online) return waiting ? `غير متصل · ${count} بانتظار الرفع` : "غير متصل · ما تراه محفوظ على جهازك";
  return waiting ? `جارٍ رفع ${count}…` : null;
}

/** A small pill above the tab bar while offline or while saved writes are being sent. */
export function SyncStatus() {
  const colors = useColors();
  const online = useOnline();
  const text = describe(online, usePendingWrites().length);
  if (!text) return null;
  return (
    <Animated.View
      accessibilityRole="alert"
      entering={FadeInDown.duration(durations.normal)}
      exiting={FadeOutDown.duration(durations.fast)}
      layout={LinearTransition.duration(durations.fast)}
      style={[styles.pill, { backgroundColor: online ? colors.ink : colors.warning }]}
    >
      <Icon name={online ? "upload" : "cloudOff"} color={colors.onInk} size={16} />
      <Text variant="small" color="onInk">
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    bottom: 76,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
});
