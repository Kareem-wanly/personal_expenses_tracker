import { useState } from "react";

import { formatShortDate, monthOf, todayISO } from "@masrufi/core/dates";
import { PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";
import { formatMoney } from "@masrufi/core/money";
import type { Report } from "@masrufi/contracts/api/responses";

import { useInsights, useProfile, useReport } from "@/api/queries";
import { CategoryBreakdown } from "@/features/home/category-breakdown";
import { InsightList } from "@/features/home/insight-list";
import { EntryItem } from "@/features/ledger/entry-item";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { MonthSwitcher } from "@/ui/month-switcher";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Section } from "@/ui/section";
import { Empty } from "@/ui/states";
import { Text } from "@/ui/text";

import { DailyChart } from "./daily-chart";
import { ReportSummary } from "./report-summary";
import { TrendChart } from "./trend-chart";

export function ReportsScreen() {
  const profile = useProfile();
  const [month, setMonth] = useState(monthOf(todayISO(profile.data?.timezone)));
  const report = useReport(month);
  const insights = useInsights(month);
  const currency = profile.data?.currency ?? "USD";

  return (
    <Screen refreshing={report.isRefetching} onRefresh={() => void report.refetch()}>
      <Text variant="title" accessibilityRole="header">التقارير</Text>
      <MonthSwitcher month={month} onChange={setMonth} />
      <QueryView query={report}>
        {(data) =>
          data.count === 0 && data.incomes.length === 0 ? (
            <Empty icon="📊" title="لا توجد بيانات" hint="لم تسجّل شيئاً في هذا الشهر." />
          ) : (
            <>
              <ReportSummary report={data} currency={currency} />
              {insights.data?.length ? <InsightList insights={insights.data} /> : null}
              <Details report={data} currency={currency} />
            </>
          )
        }
      </QueryView>
    </Screen>
  );
}

function Details({ report, currency }: { report: Report; currency: string }) {
  return (
    <>
      <Section title="آخر 6 أشهر">
        <TrendChart months={report.trend} currency={currency} />
      </Section>
      {report.count > 0 ? (
        <>
          <Section title="حسب التصنيف">
            <CategoryBreakdown totals={report.byCategory} total={report.total} currency={currency} />
          </Section>
          <Section title="كل يوم">
            <DailyChart days={report.daily} currency={currency} />
          </Section>
          <Section title="طرق الدفع">
            <Card>
              <LedgerRows
                rows={report.byMethod.map(({ method, total }) => ({
                  label: PAYMENT_METHOD_LABELS[method],
                  value: formatMoney(total, currency),
                }))}
              />
            </Card>
          </Section>
          <Section title="أكبر المصاريف">
            <Card>
              {report.top.map((item) => (
                <EntryItem key={item.id} entry={{ kind: "expense", item }} currency={currency} meta={formatShortDate(item.date)} />
              ))}
            </Card>
          </Section>
        </>
      ) : null}
    </>
  );
}
