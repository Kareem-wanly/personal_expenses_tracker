import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, formatPercent } from "@/lib/money";
import type { CategoryTotal } from "@/server/queries";

/** Ranked horizontal bars — readable on small screens, no JS required. */
export function CategoryBars({
  items,
  total,
  currency,
  limit,
}: {
  items: CategoryTotal[];
  total: number;
  currency: string;
  limit?: number;
}) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <ul className="space-y-3">
      {shown.map((c) => {
        const ratio = total > 0 ? c.total / total : 0;
        return (
          <li key={c.categoryId ?? "none"} className="flex items-center gap-3">
            <CategoryIcon icon={c.icon} color={c.color} className="size-9 text-base" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{c.name}</span>
                <span className="shrink-0 tabular" dir="ltr">
                  {formatMoney(c.total, currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(ratio * 100, 2)}%`, backgroundColor: c.color }}
                  />
                </div>
                <span className="w-11 shrink-0 text-end text-xs text-muted-foreground tabular">
                  {formatPercent(ratio)}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
