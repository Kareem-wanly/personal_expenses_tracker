import type { Dashboard } from "@masrufi/contracts/api/responses";
import { formatMoney } from "@masrufi/core/money";

import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";

type Props = { dashboard: Dashboard; budget: number | null; currency: string };

export function DayFigures({ dashboard, budget, currency }: Props) {
  const { todayTotal, weekTotal, dailyAverage, projected } = dashboard;
  const willExceed = budget !== null && projected > budget;
  return (
    <Card>
      <LedgerRows
        rows={[
          { label: "اليوم", value: formatMoney(todayTotal, currency) },
          { label: "هذا الأسبوع", value: formatMoney(weekTotal, currency) },
          { label: "المعدّل اليومي", value: formatMoney(dailyAverage, currency) },
          {
            label: "المتوقّع للشهر",
            value: formatMoney(projected, currency),
            color: willExceed ? "warning" : "text",
          },
        ]}
      />
    </Card>
  );
}
