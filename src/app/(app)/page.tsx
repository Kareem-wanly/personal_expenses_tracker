import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BudgetProgress } from "@/components/budget-progress";
import { CategoryBars } from "@/components/category-bars";
import { EmptyState } from "@/components/empty-state";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { NotificationPrompt } from "@/components/notification-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDayLabel, formatMonthLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getDashboardData, getUserToday } from "@/server/queries";

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const today = await getUserToday();
  const d = await getDashboardData(today);
  const currency = d.user.currency;
  const firstName = d.user.name.split(" ")[0];
  const hasData = d.monthTotal > 0 || d.recent.length > 0;

  return (
    <div className="space-y-6">
      <header className="pt-6">
        <p className="text-sm text-muted-foreground">أهلاً بك 👋</p>
        <h1 className="text-2xl font-bold">{firstName}</h1>
      </header>

      {/* Hero: month total + budget */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg shadow-emerald-700/20">
        <p className="text-sm opacity-90">مصاريف {formatMonthLabel(d.month)}</p>
        <p className="mt-1 text-4xl font-bold tabular" dir="ltr">
          {formatMoney(d.monthTotal, currency)}
        </p>
        {d.user.monthlyBudget ? (
          <BudgetProgress
            className="mt-4"
            spent={d.monthTotal}
            budget={d.user.monthlyBudget}
            currency={currency}
          />
        ) : (
          <Link
            href="/settings"
            className="mt-3 inline-block text-xs underline underline-offset-4 opacity-90"
          >
            حدّد ميزانية شهرية لتتبّع ما تبقّى
          </Link>
        )}
      </section>

      <NotificationPrompt hasExpenses={hasData} />

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3">
        <Stat label="اليوم" value={formatMoney(d.todayTotal, currency)} />
        <Stat label="هذا الأسبوع" value={formatMoney(d.weekTotal, currency)} />
        <Stat label="المعدّل اليومي" value={formatMoney(d.dailyAverage, currency)} />
        <Stat
          label="المتوقّع نهاية الشهر"
          value={formatMoney(d.projected, currency)}
          hint={`متبقّي ${d.daysLeft} يوم`}
        />
      </section>

      {!hasData ? (
        <EmptyState
          icon="💸"
          title="لا توجد مصاريف بعد"
          description="ابدأ بتسجيل أول مصروف لك، وسنحسب لك كل شيء تلقائياً."
          action={<AddExpenseButton label="أضف أول مصروف" className="mt-2 h-11 px-5" />}
        />
      ) : (
        <>
          {d.byCategory.length > 0 && (
            <section className="space-y-3">
              <SectionTitle title="أين تذهب أموالك" href="/reports" linkLabel="التقرير" />
              <div className="rounded-2xl border bg-card p-4">
                <CategoryBars
                  items={d.byCategory}
                  total={d.monthTotal}
                  currency={currency}
                  limit={4}
                />
              </div>
            </section>
          )}

          <section className="space-y-3">
            <SectionTitle title="آخر المصاريف" href="/expenses" linkLabel="عرض الكل" />
            <div className="rounded-2xl border bg-card p-2">
              {d.recent.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  currency={currency}
                  meta={formatDayLabel(e.date, today)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-bold tabular" dir="ltr">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
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
    <div className="flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      <Link
        href={href}
        className="flex items-center text-sm font-medium text-primary"
      >
        {linkLabel}
        <ChevronLeftIcon className="size-4" />
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pt-6" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-36 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
