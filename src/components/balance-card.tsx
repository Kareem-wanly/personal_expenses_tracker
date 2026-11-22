import Link from "next/link";

import { AddIncomeButton } from "@/components/expenses/add-income-button";
import { LedgerRows } from "@/components/ledger";
import { formatMoney, formatPercent } from "@/lib/money";
import { TAB_FORWARD } from "@/lib/tabs";

/**
 * Income vs spending for the month and the all-time balance, set as ledger
 * rows under a split bar (how much of the income is spent). Without income
 * yet, it asks for it in one line.
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
      <div className="surface flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">كم توفّر كل شهر؟</p>
          <p className="text-[13px] text-muted-foreground">سجّل دخلك لنحسب الصافي والرصيد.</p>
        </div>
        <AddIncomeButton label="إضافة دخل" className="shrink-0" />
      </div>
    );
  }

  const net = income - spent;
  const rate = income > 0 ? net / income : null;
  const spentShare = income > 0 ? Math.min(spent / income, 1) : 1;

  return (
    <div className="surface px-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">الدخل والرصيد</h2>
        <div className="flex items-center gap-1">
          <Link
            href="/expenses?type=income"
            transitionTypes={[TAB_FORWARD]}
            className="inline-flex h-9 items-center px-2 text-[14px] font-medium text-primary active:opacity-60"
          >
            السجلّ
          </Link>
          <AddIncomeButton label="دخل" />
        </div>
      </div>

      {income > 0 && (
        <div className="mt-3" aria-hidden>
          <div className="flex h-2 overflow-hidden rounded-full bg-positive/25">
            <div
              className={net < 0 ? "h-full bg-negative" : "h-full bg-ink"}
              style={{ width: `${spentShare * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[12px] text-muted-foreground">
            <span>مصروف {formatPercent(spent / income)}</span>
            <span>{rate !== null && rate >= 0 ? `مدّخر ${formatPercent(rate)}` : "تجاوزت الدخل"}</span>
          </div>
        </div>
      )}

      <LedgerRows
        className="mt-4"
        rows={[
          { label: "دخل الشهر", value: formatMoney(income, currency), tone: "positive" },
          { label: "صرفت", value: formatMoney(spent, currency) },
          { label: "صافي الشهر", value: formatMoney(net, currency), tone: net >= 0 ? "default" : "negative" },
          {
            label: "الرصيد الكلي",
            value: formatMoney(balance, currency),
            tone: balance < 0 ? "negative" : "default",
            hint: "كل الدخل ناقص كل المصاريف حتى اليوم",
          },
        ]}
      />
    </div>
  );
}
