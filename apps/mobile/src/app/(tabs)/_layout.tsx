import { Tabs, useRouter } from "expo-router";
import type { ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSyncTimezone } from "@/features/account/use-sync-timezone";
import { fonts, useColors } from "@/theme/theme";
import { Icon, type IconName } from "@/ui/icon";

const icon = (name: IconName) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} color={String(color)} />;
  };

export default function TabsLayout() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useSyncTimezone();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.hairline, height: 62 + insets.bottom },
        tabBarLabelStyle: { fontFamily: fonts.text, fontSize: 11, lineHeight: 20 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="ledger" options={{ title: "السجلّ", tabBarIcon: icon("ledger") }} />
      <Tabs.Screen
        name="add"
        options={{ title: "إضافة", tabBarIcon: icon("plus") }}
        listeners={{
          // Not a page: opens the form over the current one.
          tabPress: (event) => {
            event.preventDefault();
            router.push("/entry");
          },
        }}
      />
      <Tabs.Screen name="reports" options={{ title: "التقارير", tabBarIcon: icon("reports") }} />
      <Tabs.Screen name="more" options={{ title: "المزيد", tabBarIcon: icon("more") }} />
    </Tabs>
  );
}
