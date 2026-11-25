import { type ReactNode, useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { durations, easeOut, springs } from "@/motion/tokens";
import { useKeyboardHeight } from "@/motion/use-keyboard-height";
import { radius, spacing, useColors } from "@/theme/theme";

import { useBackButton } from "./use-back-button";

const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 900;

type Props = { children: (close: () => void) => ReactNode; onClosed: () => void };

/** Rises from the bottom; drag the handle down, tap outside or go back to dismiss. */
export function Sheet({ children, onClosed }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const y = useSharedValue(height);
  // Follows the keyboard frame by frame, so the sheet sits on top of it.
  const keyboard = useKeyboardHeight();

  useEffect(() => {
    y.set(withSpring(0, springs.gentle));
  }, [y]);

  const close = () => {
    y.set(
      withTiming(height, { duration: durations.normal, easing: easeOut }, () => {
        "worklet";
        scheduleOnRN(onClosed);
      }),
    );
  };

  useBackButton(close);

  const drag = usePanGesture({
    onUpdate: (event) => {
      "worklet";
      // Pulling up resists.
      y.set(event.translationY > 0 ? event.translationY : event.translationY / 8);
    },
    onDeactivate: (event) => {
      "worklet";
      if (event.translationY > CLOSE_DISTANCE || event.velocityY > CLOSE_VELOCITY) scheduleOnRN(close);
      else y.set(withSpring(0, springs.gentle));
    },
  });

  const top = insets.top + spacing.lg;
  const sheetStyle = useAnimatedStyle(() => ({
    maxHeight: height - top - keyboard.value,
    marginBottom: keyboard.value,
    transform: [{ translateY: y.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, height], [0.45, 0], "clamp") }));

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable accessibilityLabel="إغلاق" onPress={close} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.background },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={drag}>
          <View style={styles.handleArea}>
            <View style={[styles.handle, { backgroundColor: colors.hairline }]} />
          </View>
        </GestureDetector>
        {children(close)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "#000" },
  sheet: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    borderTopLeftRadius: radius.lg * 1.4,
    borderTopRightRadius: radius.lg * 1.4,
  },
  handleArea: { alignItems: "center", paddingVertical: spacing.md },
  handle: { width: 40, height: 5, borderRadius: 3 },
});
