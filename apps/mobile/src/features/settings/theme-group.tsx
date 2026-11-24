import { StyleSheet, View } from "react-native";

import { chooseTheme, useThemeChoice } from "@/theme/theme-store";
import { spacing } from "@/theme/theme";
import { Segmented } from "@/ui/segmented";
import { Text } from "@/ui/text";

const OPTIONS = [
  { value: "system", label: "حسب الجهاز" },
  { value: "light", label: "فاتح" },
  { value: "dark", label: "داكن" },
] as const;

export function ThemeGroup() {
  return (
    <View style={styles.group}>
      <Text variant="small" color="muted">المظهر</Text>
      <Segmented label="المظهر" options={OPTIONS} value={useThemeChoice()} onChange={chooseTheme} />
    </View>
  );
}

const styles = StyleSheet.create({ group: { gap: spacing.xs } });
