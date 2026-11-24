import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { type Colors } from "@/theme/colors";
import { fonts, radius, spacing, useColors, useStyles } from "@/theme/theme";

import { Text } from "./text";

type Props = TextInputProps & { label: string; error?: string };

export function Field({ label, error, style, ...props }: Props) {
  const colors = useColors();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.wrapper}>
      <Text variant="small" color="muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, error ? styles.invalid : null, style]}
      />
      {error ? <Text variant="small" color="negative">{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: { gap: spacing.xs },
    input: {
      minHeight: 50,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      color: colors.text,
      fontFamily: fonts.text,
      fontSize: 16,
    },
    invalid: { borderColor: colors.negative },
  });
