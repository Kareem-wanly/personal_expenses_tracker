import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

import { LedgerMeter } from "@/components/ledger";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";
import { TAB_FORWARD } from "@/lib/tabs";
import { cn } from "@/lib/utils";
import type { PlansSummary } from "@/server/plans";

const money = (list: { currency: string; total: number }[]) =>
  list.map((t) => formatMoney(t.total, t.currency)).join(" · ");

/** Two home tiles that open the Goals and Debts screens. */
export function PlansTiles({ summary }: { summary: PlansSummary }) {
  const { goals, debts } = summary;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Tile href="/goals" title="الأهداف">
        {goals.next ? (
          <>
            <p className="truncate text-[14px]">
              <span aria-hidden>{goals.next.icon}</span> {goals.next.name}
            </p>
            <div className="mt-2">
              <LedgerMeter ratio={goals.next.state.ratio} label={`تقدّم ${goals.next.name}`} />
            </div>
            <p className="mt-1 font-display text-[15px] font-semibold tabular">
              {Math.round(goals.next.state.ratio * 100)}%
            </p>
          </>
        ) : goals.count ? (
          <p className="text-[14px] text-positive">كل أهدافك تحقّقت 🎉</p>
        ) : (
          <p className="text-[14px] text-muted-foreground">ادّخر لسيارة أو سفر</p>
        )}
      </Tile>
      <Tile href="/debts" title="الديون">
        {debts.count ? (
          <div className="space-y-1 text-[13.5px]">
            {debts.owedToMe.length > 0 && (
              <p className="truncate">
                لك <b className="font-semibold text-positive tabular">{money(debts.owedToMe)}</b>
              </p>
            )}
            {debts.iOwe.length > 0 && (
              <p className="truncate">
                عليك <b className="font-semibold text-negative tabular">{money(debts.iOwe)}</b>
              </p>
            )}
            {debts.overdue > 0 && <p className={cn("text-[12.5px] font-medium text-warning")}>متأخر: {debts.overdue}</p>}
          </div>
        ) : (
          <p className="text-[14px] text-muted-foreground">لك عند أحد أو عليك؟</p>
        )}
      </Tile>
    </div>
  );
}

function Tile({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      transitionTypes={[TAB_FORWARD]}
      className="surface flex min-h-[112px] flex-col p-3.5 transition-colors active:bg-foreground/[0.04]"
    >
      <span className="mb-2 flex items-center justify-between text-[15px] font-semibold">
        {title}
        <ChevronLeftIcon className="size-4 text-muted-foreground" />
      </span>
      {children}
    </Link>
  );
}

export function PlansSkeleton() {
  return (
    <div className="space-y-6 pt-6" aria-busy>
      <Skeleton className="h-4 w-20 rounded-full" />
      <Skeleton className="h-9 w-40 rounded-full" />
      <Skeleton className="h-28 rounded-[22px]" />
      <Skeleton className="h-48 rounded-[22px]" />
    </div>
  );
}
