import { type ComponentRef, useRef } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from "react-native-reanimated";

import { openEntryMenu } from "@/features/entry-menu/menu-store";
import { useEntryActions } from "@/features/entry-menu/use-entry-actions";
import { haptics } from "@/motion/haptics";
import { PressableScale } from "@/motion/pressable-scale";
import { durations } from "@/motion/tokens";

import type { LedgerEntry } from "./entry";
import { EntryRow } from "./entry-row";

const HOLD = 380;

type Props = { entry: LedgerEntry; currency: string; meta?: string };

/** Tap to edit, hold for the menu. */
export function EntryItem({ entry, currency, meta }: Props) {
  const box = useRef<ComponentRef<typeof View>>(null);
  const { edit } = useEntryActions();

  const openMenu = () =>
    // Page coordinates: measureInWindow leaves out the status bar on Android.
    box.current?.measure((_x, _y, width, height, x, y) => {
      haptics.lift();
      openEntryMenu({ entry, currency, frame: { x, y, width, height } });
    });

  return (
    <Animated.View
      entering={FadeIn.duration(durations.normal)}
      exiting={FadeOutLeft.duration(durations.fast)}
      layout={LinearTransition.duration(durations.normal)}
    >
      <View ref={box} collapsable={false}>
        <PressableScale
          accessibilityRole="button"
          accessibilityHint="تعديل، ومع الضغط المطوّل خيارات أكثر"
          to={0.98}
          delayLongPress={HOLD}
          onLongPress={openMenu}
          onPress={() => edit(entry)}
        >
          <EntryRow entry={entry} currency={currency} meta={meta} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}
