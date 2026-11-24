import { useRouter } from "expo-router";

import type { Dashboard, Profile } from "@masrufi/contracts/api/responses";
import { formatDayLabel, parseISODate } from "@masrufi/core/dates";

import { useDashboard, useInsights, useProfile } from "@/api/queries";
import { EntryItem } from "@/features/ledger/entry-item";
import { Reveal } from "@/motion/reveal";
import { Card } from "@/ui/card";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Section } from "@/ui/section";
import { Empty } from "@/ui/states";
import { Text } from "@/ui/text";

import { BalanceCard } from "./balance-card";
import { DayFigures } from "./day-figures";
import { InsightList } from "./insight-list";
import { MonthSummary } from "./month-summary";
import { SpendingBreakdown } from "./spending-breakdown";

const fullDate = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", day: "numeric", month: "long" });

export function HomeScreen() {
  const profile = useProfile();
  const dashboard = useDashboard();
  const refresh = () => void dashboard.refetch();
  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={refresh}>
      <QueryView query={profile}>
        {(me) => <QueryView query={dashboard}>{(data) => <Home me={me} data={data} />}</QueryView>}
      </QueryView>
    </Screen>
  );
}

function Home({ me, data }: { me: Profile; data: Dashboard }) {
  const { currency, monthlyBudget } = me;
  const hasEntries = data.recent.length > 0;
  return (
    <>
      <Reveal>
        <Section title={`أهلاً، ${me.name.split(" ")[0]}`}>
          <Text color="muted">{fullDate.format(parseISODate(data.today))}</Text>
        </Section>
      </Reveal>
      <Reveal index={1}>
        <MonthSummary dashboard={data} budget={monthlyBudget} currency={currency} />
      </Reveal>
      <Reveal index={2}>
        <BalanceCard dashboard={data} currency={currency} />
      </Reveal>
      <Reveal index={3}>
        <DayFigures dashboard={data} budget={monthlyBudget} currency={currency} />
      </Reveal>
      {hasEntries ? (
        <Spending data={data} currency={currency} />
      ) : (
        <Empty icon="💸" title="لا توجد مصاريف بعد" hint="اضغط «+» لتسجيل أول مصروف." />
      )}
    </>
  );
}

function Spending({ data, currency }: { data: Dashboard; currency: string }) {
  const router = useRouter();
  const insights = useInsights(data.month);
  return (
    <>
      {insights.data?.length ? <InsightList insights={insights.data.slice(0, 3)} /> : null}
      {data.byCategory.length > 0 ? (
        <Reveal index={4}>
          <Section title="أين تذهب أموالك" link="التقرير" onPressLink={() => router.navigate("/reports")}>
            <SpendingBreakdown totals={data.byCategory} total={data.spent} currency={currency} limit={4} bar />
          </Section>
        </Reveal>
      ) : null}
      <Reveal index={5}>
        <Section title="آخر المصاريف" link="عرض الكل" onPressLink={() => router.navigate("/ledger")}>
          <Card>
            {data.recent.map((item) => (
              <EntryItem
                key={item.id}
                entry={{ kind: "expense", item }}
                currency={currency}
                meta={formatDayLabel(item.date, data.today)}
              />
            ))}
          </Card>
        </Section>
      </Reveal>
    </>
  );
}
