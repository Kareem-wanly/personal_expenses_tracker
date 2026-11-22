import {
  ChevronLeftIcon,
  DownloadIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { Suspense, ViewTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { AddIncomeButton } from "@/components/expenses/add-income-button";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { IncomeItem } from "@/components/expenses/income-item";
import { InsightsList } from "@/components/insights-list";
import { LedgerMeter, LedgerRows } from "@/components/ledger";
import { PageHeader } from "@/components/layout/page-header";
import { TabScreen } from "@/components/layout/tab-screen";
import { AnimatedMoney } from "@/components/motion/animated-money";
import { Reveal } from "@/components/motion/reveal";
import { MONTH_NEXT, MONTH_PREV, MonthSwitcher } from "@/components/month-switcher";
import { PaymentBreakdown } from "@/components/reports/payment-breakdown";
import { CategoryDonut, DailyBars, TrendBars } from "@/components/reports/report-charts";
import { SpendingBreakdown } from "@/components/spending-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate, monthOf, normalizeMonth } from "@/lib/dates";
import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getInsights, getMonthlyReport, getUserToday } from "@/server/queries";

export const metadata: Metadata = { title: "التقرير الشهري" };

const CONTENT_ENTER = { [MONTH_NEXT]: MONTH_NEXT, [MONTH_PREV]: MONTH_PREV, default: "reveal-in" };
const CONTENT_EXIT = { [MONTH_NEXT]: MONTH_NEXT, [MONTH_PREV]: MONTH_PREV, default: "reveal-out" };

export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <TabScreen>
      <PageHeader title="التقرير الشهري" />
      <Suspense
        fallback={
          <ViewTransition exit="reveal-out" default="none">
            <ReportSkeleton />
          </ViewTransition>
        }
      >
        <Report searchParams={searchParams} />
      </Suspense>
    </TabScreen>
  );
}

async function Report({
  searchParams,
}: {
  searchParams: PageProps<"/reports">["searchParams"];
}) {
  const sp = await searchParams;
  const today = await getUserToday();
  const currentMonth = monthOf(today);
  const month = normalizeMonth(sp.month, currentMonth);
  const r = await getMonthlyReport(month, today);
  const currency = r.user.currency;

  return (
    <div className="space-y-7">
      {/* Summary: month switcher, headline figure, comparison, budget. */}
      <section className="surface p-3 pb-5" aria-label="ملخّص الشهر">
        <MonthSwitcher bare month={month} currentMonth={currentMonth} basePath="/reports" />
        <ViewTransition key={`sum-${month}`} enter={CONTENT_ENTER} exit={CONTENT_EXIT} default="none">
          <div className="mt-3 flex flex-col items-center px-2 text-center">
            <AnimatedMoney
              value={r.total}
              currency={currency}
              className="block font-display text-[38px] font-semibold leading-tight tabular"
            />
            {r.change !== null ? (
              <ChangeBadge change={r.change} prev={formatMoney(r.prevTotal, currency)} />
            ) : (
              <p className="mt-1 text-[14px] text-muted-foreground">لا توجد بيانات للشهر السابق</p>
            )}
            {r.user.monthlyBudget ? (
              <BudgetLine spent={r.total} budget={r.user.monthlyBudget} currency={currency} />
            ) : null}
          </div>
        </ViewTransition>
      </section>

      <ViewTransition key={`body-${month}`} enter={CONTENT_ENTER} exit={CONTENT_EXIT} default="none">
        <div className="space-y-7">
          {r.total === 0 ? (
            <EmptyState
              icon="📊"
              title="لا توجد بيانات لهذا الشهر"
              description="أضف مصاريفك وسيظهر هنا تحليل كامل لإنفاقك."
              action={r.isCurrent ? <AddExpenseButton /> : undefined}
            />
          ) : (
            <>
              <Reveal index={0}>
                <div className="surface px-4 py-4">
                  <LedgerRows
                    rows={[
                      { label: "عدد العمليات", value: formatNumber(r.count) },
                      { label: "المعدّل اليومي", value: formatMoney(r.dailyAverage, currency) },
                      { label: "أيام الصرف", value: `${formatNumber(r.spendingDays)} يوم` },
                      r.projected !== null
                        ? { label: "المتوقّع للشهر", value: formatMoney(r.projected, currency) }
                        : r.maxDay
                          ? {
                              label: `أعلى يوم · ${formatShortDate(r.maxDay.date)}`,
                              value: formatMoney(r.maxDay.total, currency),
                            }
                          : { label: "أعلى يوم", value: "—", tone: "muted" as const },
                    ]}
                  />
                </div>
              </Reveal>

              <Suspense fallback={null}>
                <ReportInsights month={month} today={today} />
              </Suspense>

              <Section index={1} title="الدخل والادخار">
                {r.incomes.length === 0 ? (
                  <div className="surface flex items-center gap-3 p-4">
                    <p className="min-w-0 flex-1 text-[14px] text-muted-foreground">
                      لا دخل مسجّل لهذا الشهر. أضفه لتعرف صافي الشهر ونسبة الادخار.
                    </p>
                    <AddIncomeButton label="دخل" className="shrink-0" />
                  </div>
                ) : (
                  <>
                    <div className="surface grid grid-cols-3 gap-2 p-3 text-center">
                      <div>
                        <p className="text-[12px] text-muted-foreground">الدخل</p>
                        <p className="truncate text-[15px] font-bold text-positive tabular">
                          {formatMoney(r.incomeTotal, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-muted-foreground">الصافي</p>
                        <p
                          className={cn(
                            "truncate text-[15px] font-bold tabular",
                            r.net < 0 && "text-negative",
                          )}
                        >
                          {formatMoney(r.net, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-muted-foreground">نسبة الادخار</p>
                        <p className="truncate text-[15px] font-bold tabular">
                          {r.net >= 0 ? formatPercent(r.net / r.incomeTotal) : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="surface inset-list overflow-hidden">
                      {r.incomes.map((i) => (
                        <IncomeItem key={i.id} item={i} currency={currency} meta={formatShortDate(i.date)} />
                      ))}
                    </div>
                  </>
                )}
              </Section>

              <Section index={1} title="حسب التصنيف">
                <div className="surface p-4 pb-2">
                  <CategoryDonut items={r.byCategory} total={r.total} currency={currency} />
                </div>
                <SpendingBreakdown
                  items={r.byCategory}
                  total={r.total}
                  currency={currency}
                  limit={r.byCategory.length}
                  bar={false}
                />
              </Section>

              <Section index={2} title="الإنفاق اليومي">
                <div className="surface p-4">
                  <DailyBars
                    daily={r.daily}
                    average={r.dailyAverage}
                    currency={currency}
                    today={r.isCurrent ? today : undefined}
                  />
                </div>
              </Section>

              <Section index={3} title="آخر 6 أشهر">
                <div className="surface p-4">
                  <TrendBars trend={r.trend} month={month} currency={currency} />
                </div>
              </Section>

              {r.byMethod.length > 0 && (
                <Section index={4} title="طرق الدفع">
                  <PaymentBreakdown items={r.byMethod} total={r.total} currency={currency} />
                </Section>
              )}

              <Section index={5} title="أكبر 5 مصاريف">
                <div className="surface inset-list overflow-hidden">
                  {r.top.map((e) => (
                    <ExpenseItem key={e.id} expense={e} currency={currency} meta={formatShortDate(e.date)} />
                  ))}
                </div>
              </Section>

              <Reveal index={6}>
                <a
                  href={`/api/export?month=${month}`}
                  download
                  className="surface flex items-center gap-3 py-1 ps-4 active:bg-foreground/[0.06]"
                >
                  <span className="flex size-6 items-center justify-center text-foreground/70">
                    <DownloadIcon className="size-[19px]" strokeWidth={1.75} />
                  </span>
                  <span className="flex min-h-11 flex-1 items-center justify-between pe-3">
                    <span>
                      <span className="block text-[16px]">تصدير الشهر</span>
                      <span className="block text-[12px] text-muted-foreground">ملف CSV يُفتح في Excel</span>
                    </span>
                    <ChevronLeftIcon className="size-5 text-muted-foreground/60" />
                  </span>
                </a>
              </Reveal>
            </>
          )}
        </div>
      </ViewTransition>
    </div>
  );
}

async function ReportInsights({ month, today }: { month: string; today: string }) {
  const insights = await getInsights(month, today);
  return (
    <Reveal index={1}>
      <InsightsList insights={insights} limit={6} title="رؤى هذا الشهر" />
    </Reveal>
  );
}

function Section({
  title,
  subtitle,
  index,
  children,
}: {
  title: string;
  subtitle?: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal as="section" index={index} className="space-y-2.5">
      <div className="px-1">
        <h2 className="text-[18px] font-semibold">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </Reveal>
  );
}

/** Spending more is "bad": icon + words carry the meaning, colour backs it up. */
function ChangeBadge({ change, prev }: { change: number; prev: string }) {
  const up = change > 0;
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <div className="mt-2 flex flex-col items-center gap-1">
      <span
        className={cn(
          "flex items-center gap-1 text-[13px] font-semibold",
          up ? "text-negative" : "text-positive",
        )}
      >
        <Icon className="size-4" />
        {formatPercent(Math.abs(change))} {up ? "أكثر" : "أقل"} من الشهر السابق
      </span>
      <span className="text-[12px] text-muted-foreground">الشهر السابق: {prev}</span>
    </div>
  );
}

function BudgetLine({ spent, budget, currency }: { spent: number; budget: number; currency: string }) {
  const ratio = spent / budget;
  const over = ratio > 1;
  return (
    <div className="mt-5 w-full space-y-2">
      <LedgerMeter ratio={ratio} label="نسبة استهلاك الميزانية" />
      <div className="flex justify-between text-[12px]">
        <span className="text-muted-foreground">الميزانية {formatMoney(budget, currency)}</span>
        <span className={cn("font-display font-semibold tabular", over && "text-negative")}>
          {formatPercent(ratio)}
        </span>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-7" aria-busy>
      <Skeleton className="h-[200px] rounded-[16px]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-[16px]" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-[16px]" />
    </div>
  );
}
