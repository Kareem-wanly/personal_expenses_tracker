import { Tabs } from "expo-router";

import { useSyncTimezone } from "@/features/account/use-sync-timezone";
import { TabBar } from "@/features/tabs/tab-bar";
import { TABS } from "@/features/tabs/tab-order";
import { useColors } from "@/theme/theme";

export default function TabsLayout() {
  const colors = useColors();
  useSyncTimezone();

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={({ state }) => <TabBar active={state.routes[state.index].name} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
