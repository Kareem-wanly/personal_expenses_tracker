import { useIsFocused, useRouter } from "expo-router";
import { type ReactNode, useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { haptics } from "@/motion/haptics";
import { durations, easeOut, springs } from "@/motion/tokens";
import { useColors } from "@/theme/theme";

import { SwipePeek } from "./swipe-peek";
import { commits, revealedTab, rubberBand } from "./swipe";
import { SwipeProvider } from "./swipe-context";
import { TABS, type TabName, arrivalDirection, tabIndex } from "./tab-order";

/** Where an arriving page starts, as a share of the width. */
const ARRIVAL = 0.35;

type Props = { name: TabName; children: ReactNode };

/** A tab that follows the finger to its neighbours and slides in from where it lives. */
export function TabPage({ name, children }: Props) {
  const colors = useColors();
  const router = useRouter();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const index = tabIndex(name);
  const x = useSharedValue(0);
  const opacity = useSharedValue(1);
  const armed = useSharedValue(false);

  useEffect(() => {
    if (!focused) return;
    const direction = arrivalDirection(index);
    x.set(-direction * width * ARRIVAL);
    opacity.set(direction === 0 ? 1 : 0.2);
    x.set(withSpring(0, springs.gentle));
    opacity.set(withTiming(1, { duration: durations.normal }));
  }, [focused, index, width, x, opacity]);

  const open = (target: number) => router.navigate(TABS[target].href);

  const pan = usePanGesture({
    activeOffsetX: [-14, 14],
    failOffsetY: [-12, 12],
    onUpdate: (event) => {
      "worklet";
      const offset = event.translationX;
      const target = revealedTab(index, offset, TABS.length);
      x.set(target === null ? rubberBand(offset, width) : offset);
      const ready = target !== null && commits(offset, 0, width);
      if (ready !== armed.value) {
        armed.set(ready);
        if (ready) scheduleOnRN(haptics.tap);
      }
    },
    onDeactivate: (event) => {
      "worklet";
      const target = revealedTab(index, event.translationX, TABS.length);
      armed.set(false);
      if (event.canceled || target === null || !commits(event.translationX, event.velocityX, width)) {
        x.set(withSpring(0, springs.gentle));
        return;
      }
      const away = Math.sign(event.translationX) * width * 0.7;
      opacity.set(withTiming(0.2, { duration: 140 }));
      x.set(
        withTiming(away, { duration: 140, easing: easeOut }, () => {
          "worklet";
          scheduleOnRN(open, target);
        }),
      );
    },
  });

  const page = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <SwipePeek index={index} x={x} width={width} />
      <SwipeProvider value={pan}>
        <GestureDetector gesture={pan} touchAction="pan-y">
          <Animated.View style={[styles.fill, { backgroundColor: colors.background }, page]}>{children}</Animated.View>
        </GestureDetector>
      </SwipeProvider>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, overflow: "hidden" } });
