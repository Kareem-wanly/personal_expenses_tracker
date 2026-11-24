import { useState } from "react";

import { monthOf, todayISO } from "@masrufi/core/dates";

import { useInsights, useProfile, useReport } from "@/api/queries";
import { InsightList } from "@/features/home/insight-list";
import { Swap } from "@/motion/swap";
import { MonthSwitcher } from "@/ui/month-switcher";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Empty } from "@/ui/states";
import { Text } from "@/ui/text";

import { IncomeSummary } from "./income-summary";
import { ReportDetails } from "./report-details";
import { ReportSummary } from "./report-summary";

export function ReportsScreen() {
  const profile = useProfile();
  const [month, setMonth] = useState(monthOf(todayISO(profile.data?.timezone)));
  const report = useReport(month);
  const insights = useInsights(month);
  const currency = profile.data?.currency ?? "USD";
  const budget = profile.data?.monthlyBudget ?? null;

  return (
    <Screen refreshing={report.isRefetching} onRefresh={() => void report.refetch()}>
      <Text variant="title" accessibilityRole="header">التقارير</Text>
      <MonthSwitcher month={month} onChange={setMonth} />
      <QueryView query={report}>
        {(data) =>
          data.count === 0 && data.incomes.length === 0 ? (
            <Empty icon="📊" title="لا توجد بيانات" hint="لم تسجّل شيئاً في هذا الشهر." />
          ) : (
            <Swap id={month}>
              <ReportSummary report={data} budget={budget} currency={currency} />
              {insights.data?.length ? <InsightList insights={insights.data.slice(0, 6)} /> : null}
              <IncomeSummary report={data} currency={currency} />
              {data.count > 0 ? <ReportDetails report={data} currency={currency} /> : null}
            </Swap>
          )
        }
      </QueryView>
    </Screen>
  );
}
