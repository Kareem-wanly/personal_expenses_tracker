import { formatMoney, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

export function BudgetProgress({
  spent,
  budget,
  currency,
  className,
}: {
  spent: number;
  budget: number;
  currency: string;
  className?: string;
}) {
  const ratio = budget > 0 ? spent / budget : 0;
  const over = spent > budget;
  const tone = over ? "bg-red-400" : ratio > 0.8 ? "bg-amber-300" : "bg-white";

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
        aria-label="نسبة استهلاك الميزانية"
      >
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs opacity-90">
        <span>
          {over
            ? `تجاوزت الميزانية بـ ${formatMoney(spent - budget, currency)}`
            : `متبقّي ${formatMoney(budget - spent, currency)}`}
        </span>
        <span className="tabular">
          {formatPercent(ratio)} من {formatMoney(budget, currency)}
        </span>
      </div>
    </div>
  );
}
