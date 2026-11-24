import { useMutation } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useRef } from "react";

import type { Category } from "@masrufi/contracts/api/responses";
import { formatMoney, toMinor } from "@masrufi/core/money";
import { countExpenses } from "@masrufi/core/plural";
import type { DraftExpense } from "@masrufi/core/quick-add/parse";

import { api } from "@/api/client";
import { queryClient } from "@/api/query-client";
import { haptics } from "@/motion/haptics";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { Text } from "@/ui/text";
import { showToast } from "@/ui/toast-store";

type Props = { drafts: DraftExpense[]; categories: Category[]; currency: string; onDone: () => void };

/** Several expenses read from one sentence, saved together. */
export function QuickAddList({ drafts, categories, currency, onDone }: Props) {
  // Stable while the same sentence is retried, so nothing is saved twice.
  const ids = useRef(new Map<string, string>());
  const idFor = (key: string) => {
    if (!ids.current.has(key)) ids.current.set(key, randomUUID());
    return ids.current.get(key);
  };
  const named = drafts.map((draft, index) => ({
    draft,
    key: `${index}:${JSON.stringify(draft)}`,
    category: categories.find(({ id }) => id === draft.categoryId),
  }));

  const save = useMutation({
    mutationFn: () =>
      api.post("/expenses/batch", {
        items: named.map(({ draft, key }) => ({ ...draft, amount: toMinor(draft.amount ?? 0), id: idFor(key) })),
      }),
    onSuccess: async () => {
      haptics.success();
      showToast(`تمت إضافة ${countExpenses(drafts.length)}`);
      onDone();
      await queryClient.invalidateQueries();
    },
  });

  return (
    <Card>
      <LedgerRows
        rows={named.map(({ draft, category }) => ({
          label: `${category?.icon ?? "❔"} ${draft.note ?? category?.name ?? "غير مصنّف"}`,
          value: formatMoney(toMinor(draft.amount ?? 0), currency),
        }))}
      />
      {save.error ? <Text color="negative">{save.error.message}</Text> : null}
      <Button label={`إضافة ${countExpenses(drafts.length)}`} onPress={() => save.mutate()} busy={save.isPending} />
    </Card>
  );
}
