import { DownloadIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { CategoryBars } from "@/components/category-bars";
import { EmptyState } from "@/components/empty-state";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { PageHeader } from "@/components/layout/page-header";
import { MonthSwitcher } from "@/components/month-switcher";
import {
  CategoryDonut,
  DailyBars,
  TrendBars,
} from "@/components/reports/report-charts";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatShortDate, monthOf, normalizeMonth } from "@/lib/dates";
import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getMonthlyReport, getUserToday } from "@/server/queries";

export const metadata: Metadata = { title: "التقرير الشهري" };

export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <>
      <PageHeader title="التقرير الشهري" />
      <Suspense fallback={<ReportSkeleton />}>
        <Report searchParams={searchParams} />
      </Suspense>
    </>
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
    <div className="space-y-5">
      <MonthSwitcher month={month} currentMonth={currentMonth} basePath="/reports" />

      {r.total === 0 ? (
        <EmptyState
          icon="📊"
          title="لا توجد بيانات لهذا الشهر"
          description="أضف مصاريفك وسيظهر هنا تحليل كامل لإنفاقك."
          action={r.isCurrent ? <AddExpenseButton className="mt-2 h-11 px-5" /> : undefined}
        />
      ) : (
        <>
          {/* Summary */}
          <section className="rounded-3xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">إجمالي المصروف</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <p className="text-3xl font-bold tabular" dir="ltr">
                {formatMoney(r.total, currency)}
              </p>
              {r.change !== null && <ChangeBadge change={r.change} />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              الشهر السابق: {formatMoney(r.prevTotal, currency)}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4">
              <Metric label="عدد العمليات" value={formatNumber(r.count)} />
              <Metric label="المعدّل اليومي" value={formatMoney(r.dailyAverage, currency)} />
              <Metric label="أيام الصرف" value={`${r.spendingDays} يوم`} />
              {r.projected !== null ? (
                <Metric label="المتوقّع للشهر" value={formatMoney(r.projected, currency)} />
              ) : r.maxDay ? (
                <Metric
                  label="أعلى يوم"
                  value={`${formatShortDate(r.maxDay.date)}`}
                  hint={formatMoney(r.maxDay.total, currency)}
                />
              ) : null}
            </dl>

            {r.user.monthlyBudget ? (
              <BudgetLine
                spent={r.total}
                budget={r.user.monthlyBudget}
                currency={currency}
              />
            ) : null}
          </section>

          {/* By category */}
          <Card title="التوزيع حسب التصنيف">
            <CategoryDonut items={r.byCategory} total={r.total} currency={currency} />
            <div className="mt-4">
              <CategoryBars items={r.byCategory} total={r.total} currency={currency} />
            </div>
          </Card>

          {/* Daily */}
          <Card title="الإنفاق اليومي" subtitle="الخط المتقطّع = المعدّل اليومي">
            <DailyBars daily={r.daily} average={r.dailyAverage} currency={currency} />
          </Card>

          {/* Trend */}
          <Card title="آخر 6 أشهر">
            <TrendBars trend={r.trend} month={month} currency={currency} />
          </Card>

          {/* Payment methods */}
          {r.byMethod.length > 0 && (
            <Card title="طرق الدفع">
              <ul className="space-y-2">
                {r.byMethod
                  .sort((a, b) => b.total - a.total)
                  .map((m) => (
                    <li key={m.method} className="flex items-center justify-between text-sm">
                      <span>{PAYMENT_METHOD_LABELS[m.method]}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular">
                          {formatPercent(m.total / r.total)}
                        </span>
                        <span className="font-medium tabular" dir="ltr">
                          {formatMoney(m.total, currency)}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}

          {/* Top expenses */}
          <Card title="أكبر 5 مصاريف">
            <div className="-mx-2">
              {r.top.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  currency={currency}
                  meta={formatShortDate(e.date)}
                />
              ))}
            </div>
          </Card>

          <a
            href={`/api/export?month=${month}`}
            download
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
          >
            <DownloadIcon />
            تصدير الشهر (CSV / Excel)
          </a>
        </>
      )}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground tabular">{hint}</dd>}
    </div>
  );
}

function ChangeBadge({ change }: { change: number }) {
  // Spending more is "bad" → red; spending less → green.
  const up = change > 0;
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        up
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      )}
    >
      <Icon className="size-3.5" />
      {formatPercent(Math.abs(change))} {up ? "أكثر" : "أقل"} من الشهر السابق
    </span>
  );
}

function BudgetLine({
  spent,
  budget,
  currency,
}: {
  spent: number;
  budget: number;
  currency: string;
}) {
  const ratio = spent / budget;
  const over = ratio > 1;
  return (
    <div className="mt-4 space-y-1.5 border-t pt-4">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">الميزانية</span>
        <span className={cn("font-medium tabular", over && "text-destructive")}>
          {formatPercent(ratio)} من {formatMoney(budget, currency)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            over ? "bg-destructive" : ratio > 0.8 ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
