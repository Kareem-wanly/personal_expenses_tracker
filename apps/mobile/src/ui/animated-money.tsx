import type { TextStyle } from "react-native";

import { formatMoney } from "@masrufi/core/money";

import { useCountUp } from "@/motion/use-count-up";

import { Text } from "./text";

type Props = { value: number; currency: string; variant?: "figure" | "heading" | "strong"; style?: TextStyle };

/** Counts to its value. Screen readers hear the final amount. */
export function AnimatedMoney({ value, currency, variant = "figure", style }: Props) {
  const shown = useCountUp(value);
  return (
    <Text
      variant={variant}
      adjustsFontSizeToFit
      numberOfLines={1}
      accessibilityLabel={formatMoney(value, currency)}
      style={style}
    >
      {formatMoney(shown, currency)}
    </Text>
  );
}
