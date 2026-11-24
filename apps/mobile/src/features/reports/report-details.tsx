import type { Report } from "@masrufi/contracts/api/responses";
import { formatShortDate } from "@masrufi/core/dates";

import { SpendingBreakdown } from "@/features/home/spending-breakdown";
import { EntryItem } from "@/features/ledger/entry-item";
import { Reveal } from "@/motion/reveal";
import { Card } from "@/ui/card";
import { Section } from "@/ui/section";

import { CategoryDonut } from "./category-donut";
import { DailyChart } from "./daily-chart";
import { PaymentMethods } from "./payment-methods";
import { TrendChart } from "./trend-chart";

export function ReportDetails({ report, currency }: { report: Report; currency: string }) {
  const { byCategory, byMethod, daily, dailyAverage, month, top, total, trend } = report;
  return (
    <>
      <Reveal index={2}>
        <Section title="حسب التصنيف">
          <CategoryDonut totals={byCategory} total={total} currency={currency} />
          <SpendingBreakdown totals={byCategory} total={total} currency={currency} />
        </Section>
      </Reveal>
      <Reveal index={3}>
        <Section title="الإنفاق اليومي">
          <DailyChart days={daily} average={dailyAverage} currency={currency} />
        </Section>
      </Reveal>
      <Reveal index={4}>
        <Section title="آخر 6 أشهر">
          <TrendChart months={trend} viewed={month} currency={currency} />
        </Section>
      </Reveal>
      <Reveal index={5}>
        <Section title="طرق الدفع">
          <PaymentMethods methods={byMethod} total={total} currency={currency} />
        </Section>
      </Reveal>
      <Reveal index={6}>
        <Section title="أكبر المصاريف">
          <Card>
            {top.map((item) => (
              <EntryItem key={item.id} entry={{ kind: "expense", item }} currency={currency} meta={formatShortDate(item.date)} />
            ))}
          </Card>
        </Section>
      </Reveal>
    </>
  );
}
