import { Tabs } from "expo-router";

import { useCategories } from "@/api/queries";
import { useSyncTimezone } from "@/features/account/use-sync-timezone";
import { SyncStatus } from "@/features/sync/sync-status";
import { TabBar } from "@/features/tabs/tab-bar";
import { TABS } from "@/features/tabs/tab-order";
import { useColors } from "@/theme/theme";

export default function TabsLayout() {
  const colors = useColors();
  useSyncTimezone();
  // Kept ready so the add form still opens without a connection.
  useCategories();

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={({ state }) => (
        <>
          <SyncStatus />
          <TabBar active={state.routes[state.index].name} />
        </>
      )}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
