import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

import { CURRENCIES } from "@masrufi/core/constants";

import { Collapse } from "@/motion/collapse";
import { PressableScale } from "@/motion/pressable-scale";
import { durations } from "@/motion/tokens";
import { useShake } from "@/motion/use-shake";
import type { Colors } from "@/theme/colors";
import { fonts, radius, spacing, useColors, useStyles } from "@/theme/theme";
import { Chip } from "@/ui/chip";
import { Field } from "@/ui/field";
import { Text } from "@/ui/text";

import type { MoneyValue } from "./money";
import { useSuggestedRate } from "./use-suggested-rate";

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

/** The figure shrinks as it grows, like a calculator. */
const figureSize = (length: number) => (length <= 5 ? 56 : length <= 8 ? 46 : 36);

type Props = {
  value: MoneyValue;
  onChange: (value: MoneyValue) => void;
  userCurrency: string;
  errors: Record<string, string[]>;
  /** False when the amount simply is in that currency (a debt, a goal). */
  convert?: boolean;
};

export function MoneyInput({ value, onChange, userCurrency, errors, convert = true }: Props) {
  const colors = useColors();
  const styles = useStyles(createStyles);
  const [choosing, setChoosing] = useState(false);
  const suggestRate = useSuggestedRate(userCurrency);
  const { shake, style: shaking } = useShake();
  const size = figureSize(value.amount.length);
  const figure = useAnimatedStyle(() => ({ fontSize: withTiming(size, { duration: durations.fast }) }));

  useEffect(() => {
    if (errors.amount || errors.rate) shake();
  }, [errors, shake]);

  async function choose(currency: string) {
    setChoosing(false);
    onChange({ ...value, currency, rate: "" });
    if (convert) onChange({ ...value, currency, rate: await suggestRate(currency) });
  }

  return (
    <Animated.View style={[styles.block, shaking]}>
      <AnimatedInput
        accessibilityLabel="المبلغ"
        inputMode="decimal"
        placeholder="0"
        placeholderTextColor={colors.muted}
        cursorColor={colors.accent}
        value={value.amount}
        onChangeText={(amount) => onChange({ ...value, amount })}
        style={[styles.amount, figure]}
      />
      {errors.amount ? <Text color="negative">{errors.amount[0]}</Text> : null}
      <PressableScale
        accessibilityRole="button"
        onPress={() => setChoosing(!choosing)}
        style={styles.currency}
      >
        <Text>{value.currency}</Text>
      </PressableScale>
      <View style={styles.full}>
        <Collapse open={choosing}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.options}
          >
            {CURRENCIES.map(({ code, label }) => (
              <Chip
                key={code}
                label={label}
                selected={code === value.currency}
                onPress={() => void choose(code)}
              />
            ))}
          </ScrollView>
        </Collapse>
      </View>
      <View style={styles.full}>
        <Collapse open={convert && value.currency !== userCurrency}>
          <Field
            label={`1 ${value.currency} كم ${userCurrency}؟`}
            inputMode="decimal"
            value={value.rate}
            onChangeText={(rate) => onChange({ ...value, rate })}
            error={errors.rate?.[0]}
          />
          <Text variant="small" color="muted">
            سعر اليوم الرسمي من ExchangeRate-API، ويمكنك تعديله.
          </Text>
        </Collapse>
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    block: { alignItems: "center", gap: spacing.sm },
    amount: {
      width: "100%",
      minHeight: 80,
      textAlign: "center",
      fontFamily: fonts.display,
      color: colors.text,
    },
    currency: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.full,
    },
    options: { gap: spacing.sm },
    full: { width: "100%" },
  });
