import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatMonthLabel, shiftMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Prev / next month navigation that preserves the other query params. */
export function MonthSwitcher({
  month,
  currentMonth,
  basePath,
  params = {},
}: {
  month: string;
  currentMonth: string;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const href = (m: string) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (m !== currentMonth) sp.set("month", m);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const next = shiftMonth(month, 1);
  const canGoNext = next <= currentMonth;
  const btn = cn(buttonVariants({ variant: "outline", size: "icon-lg" }), "rounded-full");

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-1.5">
      {/* RTL: "previous" sits on the right and points right. */}
      <Link href={href(shiftMonth(month, -1))} className={btn} aria-label="الشهر السابق">
        <ChevronRightIcon />
      </Link>
      <div className="text-center">
        <p className="font-semibold">{formatMonthLabel(month)}</p>
        {month !== currentMonth && (
          <Link href={href(currentMonth)} className="text-xs text-primary">
            العودة للشهر الحالي
          </Link>
        )}
      </div>
      {canGoNext ? (
        <Link href={href(next)} className={btn} aria-label="الشهر التالي">
          <ChevronLeftIcon />
        </Link>
      ) : (
        <span className={cn(btn, "pointer-events-none opacity-40")} aria-hidden>
          <ChevronLeftIcon />
        </span>
      )}
    </div>
  );
}
