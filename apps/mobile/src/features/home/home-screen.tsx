import { useRouter } from "expo-router";

import { formatDayLabel, parseISODate } from "@masrufi/core/dates";

import { useDashboard, useInsights, useProfile } from "@/api/queries";
import { EntryItem } from "@/features/ledger/entry-item";
import { Card } from "@/ui/card";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Section } from "@/ui/section";
import { Empty } from "@/ui/states";
import { Text } from "@/ui/text";

import { BalanceCard } from "./balance-card";
import { CategoryBreakdown } from "./category-breakdown";
import { DayFigures } from "./day-figures";
import { InsightList } from "./insight-list";
import { MonthSummary } from "./month-summary";

const fullDate = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", day: "numeric", month: "long" });

export function HomeScreen() {
  const router = useRouter();
  const profile = useProfile();
  const dashboard = useDashboard();
  const insights = useInsights(dashboard.data?.month ?? "");
  const refresh = () => void Promise.all([dashboard.refetch(), insights.refetch()]);

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={refresh}>
      <QueryView query={profile}>
        {(me) => (
          <QueryView query={dashboard}>
            {(data) => (
              <>
                <Section title={`أهلاً، ${me.name.split(" ")[0]}`}>
                  <Text color="muted">{fullDate.format(parseISODate(data.today))}</Text>
                </Section>
                <MonthSummary dashboard={data} budget={me.monthlyBudget} currency={me.currency} />
                <BalanceCard dashboard={data} currency={me.currency} />
                <DayFigures dashboard={data} budget={me.monthlyBudget} currency={me.currency} />
                {data.recent.length > 0 && insights.data?.length ? <InsightList insights={insights.data.slice(0, 3)} /> : null}
                {data.byCategory.length > 0 ? (
                  <Section title="أين تذهب أموالك" link="التقرير" onPressLink={() => router.push("/reports")}>
                    <CategoryBreakdown totals={data.byCategory} total={data.spent} currency={me.currency} />
                  </Section>
                ) : null}
                {data.recent.length === 0 ? (
                  <Empty icon="💸" title="لا توجد مصاريف بعد" hint="اضغط «إضافة» لتسجيل أول مصروف." />
                ) : (
                  <Section title="آخر المصاريف" link="عرض الكل" onPressLink={() => router.push("/ledger")}>
                    <Card>
                      {data.recent.map((expense) => (
                        <EntryItem
                          key={expense.id}
                          entry={{ kind: "expense", item: expense }}
                          currency={me.currency}
                          meta={formatDayLabel(expense.date, data.today)}
                        />
                      ))}
                    </Card>
                  </Section>
                )}
              </>
            )}
          </QueryView>
        )}
      </QueryView>
    </Screen>
  );
}
