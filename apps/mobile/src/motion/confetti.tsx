import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { haptics } from "./haptics";
import { easeOut } from "./tokens";

const COLORS = ["#c8502b", "#4c8a5b", "#c79227", "#3e64a0", "#b9506c"];
const PIECES = 36;

/** Spread evenly but irregularly, the same every time. */
const scatter = (index: number, salt: number) => ((Math.sin(index * 12.9898 + salt) * 43758.5453) % 1 + 1) % 1;

/** A goal was reached. */
export function Confetti() {
  const reduced = useReducedMotion();
  useEffect(haptics.success, []);
  if (reduced) return null;
  return (
    <View aria-hidden style={[StyleSheet.absoluteFill, styles.layer]}>
      {Array.from({ length: PIECES }, (_, index) => (
        <Piece key={index} index={index} />
      ))}
    </View>
  );
}

function Piece({ index }: { index: number }) {
  const { width, height } = useWindowDimensions();
  const fall = useSharedValue(0);
  useEffect(() => {
    const delay = scatter(index, 1) * 500;
    fall.set(withDelay(delay, withTiming(1, { duration: 1500 + scatter(index, 2) * 900, easing: easeOut })));
  }, [fall, index]);
  const turns = 360 * (1 + scatter(index, 3) * 3);
  const drift = (scatter(index, 4) - 0.5) * 120;
  const animated = useAnimatedStyle(() => ({
    opacity: fall.value > 0.8 ? (1 - fall.value) * 5 : 1,
    transform: [
      { translateX: drift * fall.value },
      { translateY: fall.value * height * 0.9 },
      { rotate: `${turns * fall.value}deg` },
    ],
  }));
  const place = { start: scatter(index, 5) * width, backgroundColor: COLORS[index % COLORS.length] };
  return <Animated.View style={[styles.piece, place, animated]} />;
}

const styles = StyleSheet.create({
  layer: { pointerEvents: "none", overflow: "hidden" },
  piece: { position: "absolute", top: -20, width: 8, height: 14, borderRadius: 2 },
});
