import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

import { PIN_LENGTH } from "@masrufi/core/app-lock";

import { PressableScale } from "@/motion/pressable-scale";
import { springs } from "@/motion/tokens";
import { useShake } from "@/motion/use-shake";
import { radius, spacing, useColors } from "@/theme/theme";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

const ROWS = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]];

type Props = {
  message: string;
  error?: string;
  disabled?: boolean;
  /** Answers whether the PIN was accepted; if not, the dots shake and clear. */
  onComplete: (pin: string) => Promise<boolean>;
  extraKey?: ReactNode;
};

export function PinPad({ message, error, disabled = false, onComplete, extraKey }: Props) {
  const [pin, setPin] = useState("");
  const { shake, style } = useShake();

  async function press(digit: string) {
    if (disabled || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length < PIN_LENGTH) return;
    if (!(await onComplete(next))) shake();
    setPin("");
  }

  return (
    <View style={styles.pad}>
      <Text color={error ? "negative" : "muted"} accessibilityRole={error ? "alert" : undefined}>{error ?? message}</Text>
      <Animated.View style={[styles.dots, style]} accessibilityLabel={`${pin.length} من ${PIN_LENGTH}`}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <Dot key={index} filled={index < pin.length} />
        ))}
      </Animated.View>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map((digit) => (
            <Key key={digit} label={digit} disabled={disabled} onPress={() => void press(digit)} />
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <View style={styles.slot}>{extraKey}</View>
        <Key label="0" disabled={disabled} onPress={() => void press("0")} />
        <BackspaceKey onPress={() => setPin(pin.slice(0, -1))} />
      </View>
    </View>
  );
}

function Dot({ filled }: { filled: boolean }) {
  const colors = useColors();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(filled ? 1 : 0, springs.pop) }] }));
  return (
    <View style={[styles.dot, { borderColor: colors.muted }]}>
      <Animated.View style={[styles.fill, { backgroundColor: colors.ink }, animated]} />
    </View>
  );
}

function Key({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      to={0.88}
      onPress={onPress}
      style={[styles.slot, styles.key, { backgroundColor: colors.card, borderColor: colors.hairline }, disabled && styles.dimmed]}
    >
      <Text variant="title">{label}</Text>
    </PressableScale>
  );
}

function BackspaceKey({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel="مسح" to={0.88} onPress={onPress} style={styles.slot}>
      <Icon name="backspace" color={colors.muted} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pad: { alignItems: "center", gap: spacing.md },
  dots: { flexDirection: "row", gap: spacing.lg, paddingVertical: spacing.md },
  dot: { width: 16, height: 16, borderWidth: 1.5, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  fill: { width: 14, height: 14, borderRadius: 7 },
  // Phone keypads read left to right, also in Arabic: the rows are reversed for RTL.
  row: { flexDirection: "row-reverse", gap: spacing.xl },
  slot: { width: 74, height: 74, alignItems: "center", justifyContent: "center" },
  key: { borderWidth: 1, borderRadius: radius.full },
  dimmed: { opacity: 0.4 },
});
