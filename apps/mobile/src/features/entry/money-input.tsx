import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { CURRENCIES } from "@masrufi/core/constants";

import type { Colors } from "@/theme/colors";
import { fonts, radius, spacing, useColors, useStyles } from "@/theme/theme";
import { Chip } from "@/ui/chip";
import { Field } from "@/ui/field";
import { Text } from "@/ui/text";

import type { MoneyValue } from "./money";
import { useSuggestedRate } from "./use-suggested-rate";

type Props = {
  value: MoneyValue;
  onChange: (value: MoneyValue) => void;
  userCurrency: string;
  errors: Record<string, string[]>;
};

/** A large amount, the currency under it, and a rate when the currency is another one. */
export function MoneyInput({ value, onChange, userCurrency, errors }: Props) {
  const colors = useColors();
  const styles = useStyles(createStyles);
  const [choosing, setChoosing] = useState(false);
  const suggestRate = useSuggestedRate(userCurrency);
  const foreign = value.currency !== userCurrency;

  async function choose(currency: string) {
    setChoosing(false);
    onChange({ ...value, currency, rate: "" });
    onChange({ ...value, currency, rate: await suggestRate(currency) });
  }

  return (
    <View style={styles.block}>
      <TextInput
        accessibilityLabel="المبلغ"
        autoFocus={value.amount === ""}
        inputMode="decimal"
        placeholder="0"
        placeholderTextColor={colors.muted}
        value={value.amount}
        onChangeText={(amount) => onChange({ ...value, amount })}
        style={styles.amount}
      />
      {errors.amount ? <Text color="negative">{errors.amount[0]}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => setChoosing(!choosing)} style={styles.currency}>
        <Text>{value.currency}</Text>
      </Pressable>
      {choosing ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
          {CURRENCIES.map(({ code, label }) => (
            <Chip key={code} label={label} selected={code === value.currency} onPress={() => void choose(code)} />
          ))}
        </ScrollView>
      ) : null}
      {foreign ? (
        <View style={styles.rate}>
          <Field
            label={`1 ${value.currency} كم ${userCurrency}؟`}
            inputMode="decimal"
            value={value.rate}
            onChangeText={(rate) => onChange({ ...value, rate })}
            error={errors.rate?.[0]}
          />
          <Text variant="small" color="muted">سعر اليوم الرسمي من ExchangeRate-API، ويمكنك تعديله.</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    block: { alignItems: "center", gap: spacing.sm },
    amount: {
      width: "100%",
      textAlign: "center",
      fontFamily: fonts.display,
      fontSize: 52,
      minHeight: 76,
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
    rate: { width: "100%", gap: spacing.xs },
  });
