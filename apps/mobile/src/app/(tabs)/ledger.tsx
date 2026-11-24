import { LedgerScreen } from "@/features/ledger/ledger-screen";
import { TabPage } from "@/features/tabs/tab-page";

export default function Ledger() {
  return (
    <TabPage name="ledger">
      <LedgerScreen />
    </TabPage>
  );
}
