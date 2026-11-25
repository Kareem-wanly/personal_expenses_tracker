import { useState } from "react";

import { formatMoney } from "@masrufi/core/money";
import { countExpenses } from "@masrufi/core/plural";

import { useCategories, useExpenses } from "@/api/queries";
import { Field } from "@/ui/field";
import { PendingEntries } from "@/features/sync/pending-entries";
import { QueryView } from "@/ui/query-view";
import { Empty } from "@/ui/states";
import { Text } from "@/ui/text";
import { useDebounced } from "@/ui/use-debounced";

import { CategoryFilter } from "./category-filter";
import { DayGroup } from "./day-group";

type Props = { month: string; today: string; currency: string };

export function ExpenseLedger({ month, today, currency }: Props) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const categories = useCategories().data ?? [];
  const q = useDebounced(search.trim(), 300);
  const expenses = useExpenses({ month, q, categoryId }, true);

  return (
    <>
      <Field label="بحث في الملاحظات" value={search} onChangeText={setSearch} placeholder="قهوة، بنزين…" />
      <CategoryFilter categories={categories} value={categoryId} onChange={setCategoryId} />
      <PendingEntries kind="expense" month={month} currency={currency} />
      <QueryView query={expenses}>
        {(list) =>
          list.count === 0 ? (
            <Empty icon="🧾" title="لا توجد مصاريف" hint="جرّب شهراً آخر أو غيّر البحث." />
          ) : (
            <>
              <Text color="muted">
                {countExpenses(list.count)} بمجموع {formatMoney(list.total, currency)}
              </Text>
              {list.days.map((day, index) => (
                <DayGroup
                  key={day.date}
                  index={index}
                  date={day.date}
                  today={today}
                  total={day.total}
                  currency={currency}
                  entries={day.items.map((item) => ({ kind: "expense", item }))}
                />
              ))}
            </>
          )
        }
      </QueryView>
    </>
  );
}
