import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { PageHeader } from "@/components/layout/page-header";
import { TabScreen } from "@/components/layout/tab-screen";
import { MonthSwitcher } from "@/components/month-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDayLabel, monthOf, normalizeMonth } from "@/lib/dates";
import { formatMoney, formatNumber } from "@/lib/money";
import { getCategories, getExpenses, getUserToday } from "@/server/queries";

export const metadata: Metadata = { title: "المصاريف" };

export default function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  return (
    <TabScreen>
      <PageHeader title="المصاريف" />
      <Suspense fallback={<ListSkeleton />}>
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

  return (
    <div className="space-y-4">
      <MonthSwitcher
        month={month}
        currentMonth={currentMonth}
        basePath="/expenses"
        params={{ q, category: categoryId }}
      />
      <ExpenseFilters categories={categories} />

      <div className="flex items-baseline justify-between px-1 text-sm">
        <span className="text-muted-foreground">
          {formatNumber(data.count)} عملية
        </span>
        <span className="font-semibold tabular" dir="ltr">
          {formatMoney(data.total, data.currency)}
        </span>
      </div>

      {data.groups.length === 0 ? (
        <EmptyState
          icon={filtered ? "🔍" : "🗓️"}
          title={filtered ? "لا توجد نتائج مطابقة" : "لا توجد مصاريف في هذا الشهر"}
          description={filtered ? "جرّب تغيير كلمات البحث أو التصنيف." : undefined}
          action={!filtered ? <AddExpenseButton className="mt-2 h-11 px-5" /> : undefined}
        />
      ) : (
        <div className="space-y-5">
          {data.groups.map((g) => (
            <section key={g.date} aria-label={formatDayLabel(g.date, today)}>
              <div className="sticky top-[calc(env(safe-area-inset-top)+2.75rem)] z-10 -mx-4 flex items-center justify-between bg-background/90 px-5 py-2 text-xs font-medium text-muted-foreground backdrop-blur">
                <span>{formatDayLabel(g.date, today)}</span>
                <span className="tabular" dir="ltr">
                  {formatMoney(g.total, data.currency)}
                </span>
              </div>
              <div className="surface inset-list overflow-hidden">
                {g.items.map((e) => (
                  <ExpenseItem key={e.id} expense={e} currency={data.currency} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-11 rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
