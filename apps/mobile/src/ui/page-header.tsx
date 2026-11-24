import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/motion/pressable-scale";
import { radius, spacing, useColors } from "@/theme/theme";

import { Icon } from "./icon";
import { Text } from "./text";

type Props = { title: string; subtitle: string; addLabel: string; onAdd: () => void };

/** Top of a page opened from another one: back, title, and "+". */
export function PageHeader({ title, subtitle, addLabel, onAdd }: Props) {
  const colors = useColors();
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return (
    <View>
      <PressableScale accessibilityRole="button" accessibilityLabel="رجوع" onPress={back} style={styles.back}>
        <Icon name="chevronRight" color={colors.accent} size={20} />
        <Text color="accent">رجوع</Text>
      </PressableScale>
      <View style={styles.row}>
        <View>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          <Text color="muted">{subtitle}</Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          to={0.86}
          onPress={onAdd}
          style={[styles.add, { backgroundColor: colors.ink }]}
        >
          <Icon name="plus" color={colors.onInk} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  add: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
});
