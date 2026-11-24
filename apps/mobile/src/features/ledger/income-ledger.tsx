import type { Income } from "@masrufi/contracts/api/responses";
import { formatMoney } from "@masrufi/core/money";
import { countPayments } from "@masrufi/core/plural";

import { useIncomes } from "@/api/queries";
import { QueryView } from "@/ui/query-view";
import { Empty } from "@/ui/states";
import { Text } from "@/ui/text";

import { DayGroup } from "./day-group";

type Props = { month: string; today: string; currency: string };

/** Newest first; the API already sorts. */
function groupByDay(incomes: Income[]) {
  const days = new Map<string, Income[]>();
  for (const income of incomes) days.set(income.date, [...(days.get(income.date) ?? []), income]);
  return [...days];
}

export function IncomeLedger({ month, today, currency }: Props) {
  const incomes = useIncomes(month, true);
  return (
    <QueryView query={incomes}>
      {({ items, total }) =>
        items.length === 0 ? (
          <Empty icon="💼" title="لا يوجد دخل" hint="سجّل دخلك من زر «إضافة»." />
        ) : (
          <>
            <Text color="muted">{countPayments(items.length)} بمجموع {formatMoney(total, currency)}</Text>
            {groupByDay(items).map(([date, entries], index) => (
              <DayGroup
                key={date}
                index={index}
                date={date}
                today={today}
                total={entries.reduce((sum, income) => sum + income.amount, 0)}
                currency={currency}
                entries={entries.map((item) => ({ kind: "income", item }))}
              />
            ))}
          </>
        )
      }
    </QueryView>
  );
}
