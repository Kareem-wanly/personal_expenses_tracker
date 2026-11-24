import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/motion/pressable-scale";
import { durations, springs } from "@/motion/tokens";
import { fonts, useColors } from "@/theme/theme";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

import { TABS, tabIndex } from "./tab-order";

const SLOTS = TABS.length + 1;
const ADD_SLOT = 2;
const MARK_WIDTH = 28;

/** A docked bar with a mark that glides to the open tab, and "+" as an ink key. */
export function TabBar({ active }: { active: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [width, setWidth] = useState(0);
  const activeIndex = tabIndex(active);
  const slot = activeIndex < ADD_SLOT ? activeIndex : activeIndex + 1;
  const slotWidth = width / SLOTS;
  const mark = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(-(slot + 0.5) * slotWidth + MARK_WIDTH / 2, springs.snappy) }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.hairline, paddingBottom: insets.bottom }]}
    >
      {width > 0 ? <Animated.View style={[styles.mark, { backgroundColor: colors.accent }, mark]} /> : null}
      {TABS.map((tab, index) => (
        <View key={tab.name} style={index === ADD_SLOT ? styles.pair : styles.slot}>
          {index === ADD_SLOT ? <AddKey onPress={() => router.push("/entry")} /> : null}
          <TabButton tab={tab} active={index === activeIndex} onPress={() => router.navigate(tab.href)} />
        </View>
      ))}
    </View>
  );
}

type TabButtonProps = { tab: (typeof TABS)[number]; active: boolean; onPress: () => void };

function TabButton({ tab, active, onPress }: TabButtonProps) {
  const colors = useColors();
  const lift = useAnimatedStyle(() => ({
    opacity: withTiming(active ? 1 : 0.7, { duration: durations.fast }),
    transform: [{ translateY: withSpring(active ? -2 : 0, springs.snappy) }],
  }));
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      aria-selected={active}
      to={0.88}
      onPress={onPress}
      style={styles.button}
    >
      <Animated.View style={[styles.content, lift]}>
        <Icon name={tab.icon} color={active ? colors.text : colors.muted} />
        <Text color={active ? "text" : "muted"} style={styles.label}>{tab.label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

function AddKey({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.button}>
      <PressableScale accessibilityRole="button" accessibilityLabel="إضافة" to={0.86} onPress={onPress} style={[styles.add, { backgroundColor: colors.ink }]}>
        <Icon name="plus" color={colors.onInk} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth },
  mark: { position: "absolute", top: 0, start: 0, width: MARK_WIDTH, height: 2, borderRadius: 1 },
  slot: { flex: 1 },
  pair: { flex: 2, flexDirection: "row" },
  button: { flex: 1, minHeight: 62, alignItems: "center", justifyContent: "center" },
  content: { alignItems: "center", gap: 2 },
  label: { fontFamily: fonts.text, fontSize: 11, lineHeight: 18 },
  add: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
