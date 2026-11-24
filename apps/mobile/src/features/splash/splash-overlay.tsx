import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Rect } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import { easeOut, springs } from "@/motion/tokens";
import { fonts } from "@/theme/theme";
import { Text } from "@/ui/text";

const INK = "#1a1915";
const PAPER = "#f3f0e8";
const ACCENT = "#c8502b";

const AnimatedG = Animated.createAnimatedComponent(G);

/** Continues the launch image: the card pops out of the wallet, then the logo opens into the app. */
export function SplashOverlay() {
  const [done, setDone] = useState(false);
  const card = useSharedValue(0);
  const leave = useSharedValue(0);

  useEffect(() => {
    const finish = () => setDone(true);
    card.set(withSpring(1, springs.pop));
    leave.set(
      withDelay(
        480,
        withTiming(1, { duration: 380, easing: easeOut }, () => {
          "worklet";
          scheduleOnRN(finish);
        }),
      ),
    );
  }, [card, leave]);

  const cardProps = useAnimatedProps(() => ({ y: -50 * card.value }));
  const screen = useAnimatedStyle(() => ({ opacity: 1 - leave.value }));
  const mark = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(leave.value, [0, 1], [1, 1.8]) }] }));
  const word = useAnimatedStyle(() => ({
    opacity: interpolate(leave.value, [0, 0.5], [1, 0], "clamp"),
    transform: [{ translateY: leave.value * 10 }],
  }));

  if (done) return null;
  return (
    <Animated.View accessibilityElementsHidden aria-hidden style={[StyleSheet.absoluteFill, styles.screen, screen]}>
      <Animated.View style={mark}>
        <Svg width={150} height={150} viewBox="180 130 664 706">
          <AnimatedG animatedProps={cardProps}>
            <Rect x={262} y={250} width={520} height={330} rx={56} fill={ACCENT} transform="rotate(-9 522 415)" />
          </AnimatedG>
          <Rect x={196} y={352} width={632} height={440} rx={76} fill={PAPER} />
          <Rect x={610} y={498} width={218} height={148} rx={74} fill={INK} />
          <Circle cx={684} cy={572} r={30} fill={PAPER} />
        </Svg>
      </Animated.View>
      <Animated.View style={word}>
        <Text style={styles.word}>مصروفي</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: "center", justifyContent: "center", gap: 20, backgroundColor: INK, pointerEvents: "none" },
  word: { fontFamily: fonts.display, fontSize: 40, lineHeight: 60, color: PAPER },
});
