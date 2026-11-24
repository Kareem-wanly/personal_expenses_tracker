import { useState } from "react";

import { monthOf, todayISO } from "@masrufi/core/dates";

import { useProfile } from "@/api/queries";
import { MonthSwitcher } from "@/ui/month-switcher";
import { Screen } from "@/ui/screen";
import { Segmented } from "@/ui/segmented";
import { Text } from "@/ui/text";

import type { EntryKind } from "./entry";
import { ExpenseLedger } from "./expense-ledger";
import { IncomeLedger } from "./income-ledger";

const KINDS = [
  { value: "expense", label: "المصاريف" },
  { value: "income", label: "الدخل" },
] as const;

export function LedgerScreen() {
  const profile = useProfile();
  const today = todayISO(profile.data?.timezone);
  const [month, setMonth] = useState(monthOf(today));
  const [kind, setKind] = useState<EntryKind>("expense");
  const props = { month, today, currency: profile.data?.currency ?? "USD" };

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">السجلّ</Text>
      <Segmented label="نوع السجلّ" options={KINDS} value={kind} onChange={setKind} />
      <MonthSwitcher month={month} onChange={setMonth} />
      {kind === "expense" ? <ExpenseLedger {...props} /> : <IncomeLedger {...props} />}
    </Screen>
  );
}
