import { AddIncomeButton } from "@/components/expenses/add-income-button";
import { compactValueSize } from "@/lib/fit-text";
import { formatMoney, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Income vs spending for the month and the all-time balance. Without any
 * income yet, it invites the user to add one (balance needs both sides).
 */
export function BalanceCard({
  hasIncome,
  income,
  spent,
  balance,
  currency,
}: {
  hasIncome: boolean;
  income: number;
  spent: number;
  balance: number;
  currency: string;
}) {
  if (!hasIncome) {
    return (
      <div className="surface flex items-center gap-3 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-[#34c759]/15 text-[22px]">
          💼
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">اعرف كم توفّر</p>
          <p className="text-[13px] text-muted-foreground">سجّل دخلك (راتب، عمل حر…) لنحسب رصيدك ونسبة ادخارك.</p>
        </div>
        <AddIncomeButton label="دخل" className="shrink-0" />
      </div>
    );
  }

  const net = income - spent;
  const rate = income > 0 ? net / income : null;

  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">الدخل والرصيد</h2>
        <AddIncomeButton label="دخل" />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[14px] bg-[#34c759]/10 px-1 py-2.5">
          <dt className="text-[12px] text-muted-foreground">دخل الشهر</dt>
          <dd
            className={cn(
              "mt-0.5 truncate font-bold text-[#248a3d] tabular dark:text-[#30d158]",
              compactValueSize(formatMoney(income, currency)),
            )}
          >
            {formatMoney(income, currency)}
          </dd>
        </div>
        <div className="rounded-[14px] bg-foreground/[0.05] px-1 py-2.5">
          <dt className="text-[12px] text-muted-foreground">صرفت</dt>
          <dd className={cn("mt-0.5 truncate font-bold tabular", compactValueSize(formatMoney(spent, currency)))}>
            {formatMoney(spent, currency)}
          </dd>
        </div>
        <div className={cn("rounded-[14px] px-1 py-2.5", net >= 0 ? "bg-[#0a84ff]/10" : "bg-[#ff3b30]/10")}>
          <dt className="text-[12px] text-muted-foreground">صافي الشهر</dt>
          <dd
            className={cn(
              "mt-0.5 truncate font-bold tabular",
              compactValueSize(formatMoney(net, currency)),
              net >= 0 ? "text-[#0a84ff]" : "text-[#d70015] dark:text-[#ff6961]",
            )}
          >
            {formatMoney(net, currency)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-foreground/[0.08] pt-3 text-[13px]">
        <span className="text-muted-foreground">
          {rate === null
            ? "لا دخل مسجّل هذا الشهر"
            : rate >= 0
              ? `نسبة الادخار ${formatPercent(rate)}`
              : "مصاريفك تجاوزت دخلك هذا الشهر"}
        </span>
        <span>
          الرصيد الكلي{" "}
          <b className={cn("tabular", balance < 0 && "text-[#d70015] dark:text-[#ff6961]")}>
            {formatMoney(balance, currency)}
          </b>
        </span>
      </div>
    </div>
  );
}
