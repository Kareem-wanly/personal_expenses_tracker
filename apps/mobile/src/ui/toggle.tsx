import { Pressable, StyleSheet } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated";

import { haptics } from "@/motion/haptics";
import { springs } from "@/motion/tokens";
import { useColors } from "@/theme/theme";

const WIDTH = 50;
const THUMB = 26;
const GAP = 2;

type Props = { label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean };

export function Toggle({ label, value, onChange, disabled = false }: Props) {
  const colors = useColors();
  const progress = useDerivedValue(() => withSpring(value ? 1 : 0, springs.snappy));
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.fill, colors.positive]),
  }));
  // Right to left: "on" is towards the left.
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.value * (WIDTH - THUMB - GAP * 2) }],
  }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onChange(!value);
      }}
    >
      <Animated.View style={[styles.track, { borderColor: colors.hairline }, track]}>
        <Animated.View style={[styles.thumb, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: WIDTH, height: THUMB + GAP * 2, borderRadius: WIDTH / 2, borderWidth: 1, padding: GAP - 1 },
  thumb: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: "#fff" },
});
