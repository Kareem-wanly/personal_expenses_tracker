import { Text as NativeText, type TextProps, type TextStyle } from "react-native";

import { type Colors } from "@/theme/colors";
import { fonts, useColors } from "@/theme/theme";

const variants = {
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 42 },
  heading: { fontFamily: fonts.display, fontSize: 19, lineHeight: 30 },
  figure: { fontFamily: fonts.display, fontSize: 44, lineHeight: 60 },
  body: { fontFamily: fonts.text, fontSize: 16, lineHeight: 26 },
  strong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 26 },
  small: { fontFamily: fonts.text, fontSize: 13, lineHeight: 22 },
} satisfies Record<string, TextStyle>;

type Props = TextProps & { variant?: keyof typeof variants; color?: keyof Colors };

export function Text({ variant = "body", color = "text", style, ...props }: Props) {
  const colors = useColors();
  const base: TextStyle = { color: colors[color], writingDirection: "rtl" };
  return <NativeText {...props} style={[variants[variant], base, style]} />;
}
