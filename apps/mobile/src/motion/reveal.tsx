import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { STAGGER, durations, easeOut } from "./tokens";

type Props = { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> };

/** Fades and lifts into place; `index` makes a screen assemble from top to bottom. */
export function Reveal({ children, index = 0, style }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.duration(durations.slow).delay(40 + index * STAGGER).easing(easeOut)}
      layout={LinearTransition.duration(durations.normal)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
