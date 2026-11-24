import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

import { haptics } from "@/motion/haptics";
import { springs } from "@/motion/tokens";
import { type Colors } from "@/theme/colors";
import { radius, useStyles } from "@/theme/theme";

import { Text } from "./text";

const PADDING = 3;

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Choose one of a few; a thumb slides to the choice. */
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  const step = (width - PADDING * 2) / options.length;
  const index = options.findIndex((option) => option.value === value);
  // Right to left: the first option is on the right, so moving on means moving left.
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(-index * step, springs.snappy) }],
  }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.track}
    >
      {width > 0 ? <Animated.View style={[styles.thumb, { width: step }, thumb]} /> : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => {
              haptics.tap();
              onChange(option.value);
            }}
            style={styles.option}
          >
            <Text variant={selected ? "strong" : "body"} color={selected ? "text" : "muted"} style={styles.label}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    track: { flexDirection: "row", padding: PADDING, borderRadius: radius.md, backgroundColor: colors.fill },
    thumb: { position: "absolute", top: PADDING, bottom: PADDING, start: PADDING, borderRadius: 9, backgroundColor: colors.card },
    option: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center" },
    label: { fontSize: 14 },
  });
