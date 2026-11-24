import { Pressable, StyleSheet, View } from "react-native";

import type { LedgerEntry } from "@/features/ledger/entry";
import type { Colors } from "@/theme/colors";
import { spacing, useColors } from "@/theme/theme";
import { Icon, type IconName } from "@/ui/icon";
import { Text } from "@/ui/text";

import { closeEntryMenu } from "./menu-store";
import { useEntryActions } from "./use-entry-actions";

const ITEM_HEIGHT = 50;
export const MENU_WIDTH = 240;
export const MENU_HEIGHT = ITEM_HEIGHT * 3;

type Item = { label: string; icon: IconName; color: keyof Colors; run: (entry: LedgerEntry) => unknown };

export function EntryMenuItems({ entry }: { entry: LedgerEntry }) {
  const colors = useColors();
  const { edit, repeatToday, remove } = useEntryActions();
  const items: Item[] = [
    { label: "تعديل", icon: "edit", color: "text", run: edit },
    { label: "تكرار اليوم", icon: "copy", color: "text", run: repeatToday },
    { label: "حذف", icon: "trash", color: "negative", run: remove },
  ];
  return (
    <View accessibilityRole="menu">
      {items.map(({ label, icon, color, run }) => (
        <Pressable
          key={label}
          accessibilityRole="menuitem"
          onPress={() => {
            closeEntryMenu();
            void run(entry);
          }}
          style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.fill }]}
        >
          <Text color={color}>{label}</Text>
          <Icon name={icon} color={colors[color]} size={20} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
});
