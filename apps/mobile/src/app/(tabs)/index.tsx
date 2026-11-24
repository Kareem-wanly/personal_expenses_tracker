import { HomeScreen } from "@/features/home/home-screen";
import { TabPage } from "@/features/tabs/tab-page";

export default function Home() {
  return (
    <TabPage name="index">
      <HomeScreen />
    </TabPage>
  );
}
