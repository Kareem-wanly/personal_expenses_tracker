import type { Category } from "@masrufi/contracts/api/responses";
import { INCOME_SOURCE_META } from "@masrufi/core/constants";
import { formatShortDate } from "@masrufi/core/dates";
import type { IncomeSource } from "@masrufi/core/enums";
import { formatMoney } from "@masrufi/core/money";

import { useCategories } from "@/api/queries";
import { usePendingWrites } from "@/api/use-pending-writes";
import type { Write } from "@/api/write-policy";
import { Group, Row } from "@/ui/group";

type Draft = {
  amount: number;
  currency?: string;
  date: string;
  note?: string | null;
  categoryId?: string | null;
  source?: IncomeSource;
};

/** New entries a write carries (one, or several from a sentence). */
function draftsOf({ method, path, body }: Write, kind: "expense" | "income"): Draft[] {
  if (method !== "POST") return [];
  if (kind === "expense" && path === "/expenses/batch") return (body as { items: Draft[] }).items;
  return path === (kind === "expense" ? "/expenses" : "/incomes") ? [body as Draft] : [];
}

function labelOf(draft: Draft, kind: "expense" | "income", categories: Category[]) {
  if (kind === "income") return INCOME_SOURCE_META[draft.source ?? "salary"];
  const category = categories.find(({ id }) => id === draft.categoryId);
  return { label: category?.name ?? "غير مصنّف", icon: category?.icon ?? "❔" };
}

type Props = { kind: "expense" | "income"; month: string; currency: string };

/** Entries made offline, shown until the server has them. */
export function PendingEntries({ kind, month, currency }: Props) {
  const categories = useCategories().data ?? [];
  const drafts = usePendingWrites()
    .flatMap((write) => draftsOf(write, kind))
    .filter(({ date }) => date.startsWith(month));
  if (drafts.length === 0) return null;
  return (
    <Group title="بانتظار الرفع" footer="محفوظة على جهازك، وتُرفع تلقائياً عند عودة الاتصال.">
      {drafts.map((draft, index) => {
        const { label, icon } = labelOf(draft, kind, categories);
        return (
          <Row
            key={index}
            emoji={icon}
            title={draft.note || label}
            subtitle={`${label} · ${formatShortDate(draft.date)}`}
            trailing={formatMoney(draft.amount, draft.currency ?? currency)}
            faded
          />
        );
      })}
    </Group>
  );
}
