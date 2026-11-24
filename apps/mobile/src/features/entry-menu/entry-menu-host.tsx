import { BlurView } from "expo-blur";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { EntryRow } from "@/features/ledger/entry-row";
import { durations, springs } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";
import { useBackButton } from "@/ui/use-back-button";

import { EntryMenuItems, MENU_HEIGHT, MENU_WIDTH } from "./entry-menu-items";
import { placeMenu } from "./menu-layout";
import { type EntryMenu, closeEntryMenu, useEntryMenu } from "./menu-store";

export function EntryMenuHost() {
  const menu = useEntryMenu();
  return menu ? <Overlay key={menu.entry.item.id} menu={menu} /> : null;
}

/** The row lifts over a blurred screen and a menu opens beside it. */
function Overlay({ menu }: { menu: EntryMenu }) {
  const colors = useColors();
  const screen = useWindowDimensions();
  const { entry, currency, frame } = menu;
  const { rowTop, menuTop } = placeMenu(frame, MENU_HEIGHT, screen.height);
  const lifted = useSharedValue(0);

  useEffect(() => {
    lifted.set(withSpring(1, springs.snappy));
  }, [lifted]);
  useBackButton(closeEntryMenu);

  const row = useAnimatedStyle(() => ({
    transform: [{ translateY: (rowTop - frame.y) * lifted.value }, { scale: 1 + 0.03 * lifted.value }],
  }));
  // Right to left: `start` counts from the right edge of the screen.
  const start = screen.width - frame.x - frame.width;

  return (
    <Animated.View
      entering={FadeIn.duration(durations.fast)}
      exiting={FadeOut.duration(durations.fast)}
      style={[StyleSheet.absoluteFill, styles.overlay]}
    >
      {Platform.OS === "android" ? null : <BlurView intensity={30} style={StyleSheet.absoluteFill} />}
      <Pressable
        accessibilityLabel="إغلاق"
        onPress={closeEntryMenu}
        style={[StyleSheet.absoluteFill, styles.dim]}
      />
      <Animated.View
        style={[
          styles.row,
          { start, top: frame.y, width: frame.width, height: frame.height, backgroundColor: colors.card },
          row,
        ]}
      >
        <EntryRow entry={entry} currency={currency} />
      </Animated.View>
      <Animated.View
        entering={ZoomIn.springify().stiffness(springs.snappy.stiffness).damping(springs.snappy.damping)}
        style={[
          styles.menu,
          {
            start: Math.max(spacing.lg, start),
            top: menuTop,
            backgroundColor: colors.card,
            borderColor: colors.hairline,
          },
        ]}
      >
        <EntryMenuItems entry={entry} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { zIndex: 10 },
  dim: { backgroundColor: "#0006" },
  row: {
    position: "absolute",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  menu: {
    position: "absolute",
    width: MENU_WIDTH,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
});
