import type { ReactNode } from "react";
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from "react-native-reanimated";

import { durations } from "./tokens";

type Props = { open: boolean; children: ReactNode };

/** Content that unfolds under what was tapped. */
export function Collapse({ open, children }: Props) {
  if (!open) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(durations.normal)}
      exiting={FadeOutUp.duration(durations.fast)}
      layout={LinearTransition.duration(durations.normal)}
    >
      {children}
    </Animated.View>
  );
}
