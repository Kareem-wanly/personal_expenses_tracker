import { SettingsScreen } from "@/features/settings/settings-screen";
import { TabPage } from "@/features/tabs/tab-page";

export default function Settings() {
  return (
    <TabPage name="settings">
      <SettingsScreen />
    </TabPage>
  );
}
