import { useRouter } from "expo-router";

import type { Dashboard } from "@masrufi/contracts/api/responses";
import { formatMoney } from "@masrufi/core/money";

import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { Text } from "@/ui/text";

type Props = { dashboard: Dashboard; currency: string };

export function BalanceCard({ dashboard, currency }: Props) {
  const router = useRouter();
  const { hasIncome, earned, spent, balance } = dashboard;
  const addIncome = () => router.push({ pathname: "/entry", params: { kind: "income" } });

  if (!hasIncome) {
    return (
      <Card>
        <Text variant="heading">الدخل والرصيد</Text>
        <Text color="muted">سجّل راتبك أو أي دخل لتعرف كم وفّرت.</Text>
        <Button label="أضف دخلاً" kind="plain" onPress={addIncome} />
      </Card>
    );
  }
  const net = earned - spent;
  return (
    <Card>
      <Text variant="heading">الدخل والرصيد</Text>
      <LedgerRows
        rows={[
          { label: "دخل الشهر", value: formatMoney(earned, currency), color: "positive" },
          { label: "صرفت", value: formatMoney(spent, currency) },
          { label: "صافي الشهر", value: formatMoney(net, currency), color: net < 0 ? "negative" : "text" },
          { label: "الرصيد الكلي", value: formatMoney(balance, currency), color: balance < 0 ? "negative" : "text" },
        ]}
      />
      <Button label="أضف دخلاً" kind="plain" onPress={addIncome} />
    </Card>
  );
}
