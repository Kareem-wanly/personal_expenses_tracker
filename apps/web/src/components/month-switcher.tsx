import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { formatMonthLabel, shiftMonth } from "@masrufi/core/dates";
import { cn } from "@/lib/utils";

/** View-transition types for month paging (see globals.css). */
export const MONTH_NEXT = "month-next";
export const MONTH_PREV = "month-prev";

const round =
  "flex size-9 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground transition-transform active:scale-90 dark:bg-white/10";

/**
 * Prev / next month navigation that preserves the other query params.
 * `bare` drops the card chrome so it can sit inside another surface.
 */
export function MonthSwitcher({
  month,
  currentMonth,
  basePath,
  params = {},
  bare = false,
}: {
  month: string;
  currentMonth: string;
  basePath: string;
  params?: Record<string, string | undefined>;
  bare?: boolean;
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

  return (
    <div className={cn("flex items-center justify-between gap-2", !bare && "surface p-2")}>
      {/* RTL: "previous" sits on the right and points right. */}
      <Link
        href={href(shiftMonth(month, -1))}
        transitionTypes={[MONTH_PREV]}
        scroll={false}
        className={round}
        aria-label="الشهر السابق"
      >
        <ChevronRightIcon className="size-5" />
      </Link>
      <div className="min-w-0 text-center">
        <p className="text-[17px] font-semibold">{formatMonthLabel(month)}</p>
        {month !== currentMonth && (
          <Link
            href={href(currentMonth)}
            transitionTypes={[MONTH_NEXT]}
            scroll={false}
            className="text-[13px] font-medium text-primary active:opacity-60"
          >
            العودة للشهر الحالي
          </Link>
        )}
      </div>
      {canGoNext ? (
        <Link
          href={href(next)}
          transitionTypes={[MONTH_NEXT]}
          scroll={false}
          className={round}
          aria-label="الشهر التالي"
        >
          <ChevronLeftIcon className="size-5" />
        </Link>
      ) : (
        <span className={cn(round, "pointer-events-none opacity-30")} aria-hidden>
          <ChevronLeftIcon className="size-5" />
        </span>
      )}
    </div>
  );
}
