import {
  ChevronLeftIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";

import { BalanceCard } from "@/components/balance-card";
import { EmptyState } from "@/components/empty-state";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { InsightsList } from "@/components/insights-list";
import { LedgerMeter, LedgerRows } from "@/components/ledger";
import { PageHeader } from "@/components/layout/page-header";
import { TabScreen } from "@/components/layout/tab-screen";
import { AnimatedMoney } from "@/components/motion/animated-money";
import { Reveal } from "@/components/motion/reveal";
import { NotificationPrompt } from "@/components/notification-prompt";
import { SpendingBreakdown } from "@/components/spending-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDayLabel, formatMonthLabel, parseISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { TAB_FORWARD } from "@/lib/tabs";
import { getDashboardData, getInsights, getUserToday } from "@/server/queries";

export default function HomePage() {
  return (
    <TabScreen>
      <Suspense
        fallback={
          <ViewTransition exit="reveal-out" default="none">
            <DashboardSkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="reveal-in" default="none">
          <Dashboard />
        </ViewTransition>
      </Suspense>
    </TabScreen>
  );
}

const dateFmt = new Intl.DateTimeFormat("ar-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

async function Dashboard() {
  const today = await getUserToday();
  const d = await getDashboardData(today);
  const currency = d.user.currency;
  const firstName = d.user.name.split(" ")[0];
  const hasData = d.monthTotal > 0 || d.recent.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={dateFmt.format(parseISODate(today))}
        title={`أهلاً، ${firstName}`}
        action={
          <Link
            href="/settings"
            transitionTypes={[TAB_FORWARD]}
            aria-label="الإعدادات"
            className="pressable flex size-10 items-center justify-center rounded-full bg-ink font-display text-[15px] font-semibold text-ink-foreground"
          >
            {firstName.slice(0, 1)}
          </Link>
        }
      />

      <Reveal index={0}>
        <MonthCard
          month={d.month}
          total={d.monthTotal}
          budget={d.user.monthlyBudget}
          daysLeft={d.daysLeft}
          pace={d.pace}
          currency={currency}
        />
      </Reveal>

      <NotificationPrompt hasExpenses={hasData} />

      <Reveal index={1}>
        <BalanceCard
          hasIncome={d.hasIncome}
          income={d.monthIncome}
          spent={d.monthTotal}
          balance={d.balance}
          currency={currency}
        />
      </Reveal>

      <Reveal index={1}>
        <div className="surface px-4 py-4">
          <LedgerRows
            rows={[
              { label: "اليوم", value: formatMoney(d.todayTotal, currency) },
              { label: "هذا الأسبوع", value: formatMoney(d.weekTotal, currency) },
              { label: "المعدّل اليومي", value: formatMoney(d.dailyAverage, currency) },
              {
                label: "المتوقّع للشهر",
                value: formatMoney(d.projected, currency),
                tone: d.user.monthlyBudget && d.projected > d.user.monthlyBudget ? "warning" : "default",
              },
            ]}
          />
        </div>
      </Reveal>

      {!hasData ? (
        <Reveal index={2}>
          <EmptyState
            icon="💸"
            title="لا توجد مصاريف بعد"
            description="ابدأ بتسجيل أول مصروف لك، وسنحسب لك كل شيء تلقائياً."
            action={<AddExpenseButton label="أضف أول مصروف" className="mt-1" />}
          />
        </Reveal>
      ) : (
        <>
          {/* Insights stream in separately so they never delay the dashboard. */}
          <Suspense fallback={null}>
            <DashboardInsights month={d.month} today={today} />
          </Suspense>

          {d.byCategory.length > 0 && (
            <Reveal as="section" index={2} className="space-y-2.5">
              <SectionTitle title="أين تذهب أموالك" href="/reports" linkLabel="التقرير" />
              <SpendingBreakdown items={d.byCategory} total={d.monthTotal} currency={currency} />
            </Reveal>
          )}

          <Reveal as="section" index={3} className="space-y-2.5">
            <SectionTitle title="آخر المصاريف" href="/expenses" linkLabel="عرض الكل" />
            <div className="surface inset-list overflow-hidden">
              {d.recent.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  currency={currency}
                  meta={formatDayLabel(e.date, today)}
                />
              ))}
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}

async function DashboardInsights({ month, today }: { month: string; today: string }) {
  const insights = await getInsights(month, today);
  return (
    <Reveal index={2}>
      <InsightsList insights={insights} limit={3} />
    </Reveal>
  );
}

/**
 * Month header set like a ledger page: the month on a ruled line, the total
 * as a large figure, then a ruled budget meter with a pace notch.
 */
function MonthCard({
  month,
  total,
  budget,
  daysLeft,
  pace,
  currency,
}: {
  month: string;
  total: number;
  budget: number | null;
  daysLeft: number;
  pace: number;
  currency: string;
}) {
  const ratio = budget ? total / budget : 0;
  const over = !!budget && total > budget;

  return (
    <section aria-label="ملخّص الشهر" className="pt-1">
      <div className="section-label">
        <span>{formatMonthLabel(month)}</span>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <AnimatedMoney
          value={total}
          currency={currency}
          className="block font-display text-[clamp(2.4rem,12vw,3.25rem)] font-semibold leading-none whitespace-nowrap tabular"
        />
        <span className="shrink-0 text-[13px] text-muted-foreground">
          {daysLeft === 0 ? "آخر يوم في الشهر" : `${daysLeft} يوم متبقّية`}
        </span>
      </div>
      <p className="mt-1 text-[14px] text-muted-foreground">صرفت هذا الشهر</p>

      {budget ? (
        <div className="mt-5 space-y-2">
          <LedgerMeter ratio={ratio} pace={pace} label="نسبة استهلاك الميزانية" />
          <div className="flex items-baseline justify-between text-[13px]">
            <span className={over ? "font-medium text-negative" : "text-muted-foreground"}>
              {over ? (
                <>تجاوزت الميزانية بـ {formatMoney(total - budget, currency)}</>
              ) : (
                <>
                  متبقّي <b className="font-semibold text-foreground">{formatMoney(budget - total, currency)}</b> من{" "}
                  {formatMoney(budget, currency)}
                </>
              )}
            </span>
            <span className="font-display font-semibold tabular">{Math.round(ratio * 100)}%</span>
          </div>
        </div>
      ) : (
        <Link
          href="/settings"
          transitionTypes={[TAB_FORWARD]}
          className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-primary"
        >
          حدّد ميزانية شهرية
          <ChevronLeftIcon className="size-4" />
        </Link>
      )}
    </section>
  );
}

function SectionTitle({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <Link
        href={href}
        transitionTypes={[TAB_FORWARD]}
        className="flex items-center text-[15px] font-medium text-primary active:opacity-60"
      >
        {linkLabel}
        <ChevronLeftIcon className="size-4" />
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7" aria-busy>
      <div className="space-y-2 pb-5 pt-10">
        <Skeleton className="h-3.5 w-28 rounded-full" />
        <Skeleton className="h-8 w-40 rounded-full" />
      </div>
      <Skeleton className="h-44 rounded-[28px]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-[22px]" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-[22px]" />
    </div>
  );
}
