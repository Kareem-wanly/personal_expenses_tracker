import type { Metadata } from "next";
import { Suspense, ViewTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { PageHeader } from "@/components/layout/page-header";
import { TabScreen } from "@/components/layout/tab-screen";
import { AnimatedMoney } from "@/components/motion/animated-money";
import { Reveal } from "@/components/motion/reveal";
import { MONTH_NEXT, MONTH_PREV, MonthSwitcher } from "@/components/month-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { daysInMonth, formatDayLabel, monthOf, normalizeMonth } from "@/lib/dates";
import { formatMoney, formatNumber } from "@/lib/money";
import { getCategories, getExpenses, getUserToday } from "@/server/queries";

export const metadata: Metadata = { title: "المصاريف" };

/** Month paging slides; filtering crossfades; first load rises in. */
const CONTENT_ENTER = { [MONTH_NEXT]: MONTH_NEXT, [MONTH_PREV]: MONTH_PREV, default: "reveal-in" };
const CONTENT_EXIT = { [MONTH_NEXT]: MONTH_NEXT, [MONTH_PREV]: MONTH_PREV, default: "reveal-out" };

export default function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  return (
    <TabScreen>
      <PageHeader title="المصاريف" />
      <Suspense
        fallback={
          <ViewTransition exit="reveal-out" default="none">
            <ListSkeleton />
          </ViewTransition>
        }
      >
        <ExpensesContent searchParams={searchParams} />
      </Suspense>
    </TabScreen>
  );
}

async function ExpensesContent({
  searchParams,
}: {
  searchParams: PageProps<"/expenses">["searchParams"];
}) {
  const sp = await searchParams;
  const today = await getUserToday();
  const currentMonth = monthOf(today);
  const month = normalizeMonth(sp.month, currentMonth);
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const categoryId = typeof sp.category === "string" ? sp.category : undefined;

  const [categories, data] = await Promise.all([
    getCategories(),
    getExpenses({ month, q, categoryId }),
  ]);
  const filtered = !!(q || categoryId);
  const elapsed = month === currentMonth ? Number(today.slice(8, 10)) : daysInMonth(month);

  return (
    <div className="space-y-5">
      {/* Month summary: switcher on top, the month's figure below. */}
      <section className="surface p-3 pb-5" aria-label="ملخّص الشهر">
        <MonthSwitcher
          bare
          month={month}
          currentMonth={currentMonth}
          basePath="/expenses"
          params={{ q, category: categoryId }}
        />
        <ViewTransition
          key={`sum-${month}-${q ?? ""}-${categoryId ?? ""}`}
          enter={CONTENT_ENTER}
          exit={CONTENT_EXIT}
          default="none"
        >
          <div className="mt-3 text-center">
            <AnimatedMoney
              value={data.total}
              currency={data.currency}
              className="block text-[34px] font-bold leading-tight tracking-tight tabular"
            />
            <p className="mt-1 text-[14px] text-muted-foreground">
              {formatNumber(data.count)} عملية
              {data.count > 0 && !filtered && (
                <> · المعدّل اليومي {formatMoney(Math.round(data.total / elapsed), data.currency)}</>
              )}
            </p>
          </div>
        </ViewTransition>
      </section>

      <ExpenseFilters categories={categories} />

      <ViewTransition
        key={`list-${month}-${q ?? ""}-${categoryId ?? ""}`}
        enter={CONTENT_ENTER}
        exit={CONTENT_EXIT}
        default="none"
      >
        <div>
          {data.groups.length === 0 ? (
            <EmptyState
              icon={filtered ? "🔍" : "🗓️"}
              title={filtered ? "لا توجد نتائج مطابقة" : "لا توجد مصاريف في هذا الشهر"}
              description={filtered ? "جرّب تغيير كلمات البحث أو التصنيف." : undefined}
              action={!filtered ? <AddExpenseButton /> : undefined}
            />
          ) : (
            <div className="space-y-4">
              {data.groups.map((g, i) => (
                <Reveal as="section" key={g.date} index={Math.min(i, 6)}>
                  <h2
                    aria-label={formatDayLabel(g.date, today)}
                    className="sticky top-[calc(env(safe-area-inset-top)+2.75rem)] z-10 -mx-4 flex items-baseline justify-between bg-background/85 px-5 pb-2 pt-2.5 backdrop-blur-xl"
                  >
                    <span className="text-[15px] font-semibold">{formatDayLabel(g.date, today)}</span>
                    <span className="text-[13px] font-medium text-muted-foreground tabular" dir="ltr">
                      {formatMoney(g.total, data.currency)}
                    </span>
                  </h2>
                  <div className="surface inset-list overflow-hidden">
                    {g.items.map((e) => (
                      <ExpenseItem key={e.id} expense={e} currency={data.currency} />
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </ViewTransition>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      <Skeleton className="h-[136px] rounded-[22px]" />
      <Skeleton className="h-10 rounded-[11px]" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-36 rounded-[22px]" />
      ))}
    </div>
  );
}
