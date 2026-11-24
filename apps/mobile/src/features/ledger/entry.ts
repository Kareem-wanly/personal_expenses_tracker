import type { Expense, ExpenseRow, Income } from "@masrufi/contracts/api/responses";
import { INCOME_SOURCE_META, PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";

/** One line of the ledger: money out or money in. */
export type LedgerEntry =
  | { kind: "expense"; item: ExpenseRow }
  | { kind: "income"; item: Income };

export type EntryKind = LedgerEntry["kind"];

export type EditableEntry = { kind: "expense"; item: Expense } | { kind: "income"; item: Income };

export function describeEntry(entry: LedgerEntry) {
  if (entry.kind === "income") {
    const { label, icon, color } = INCOME_SOURCE_META[entry.item.source];
    return { title: entry.item.note || label, subtitle: label, icon, color };
  }
  const { category, note, paymentMethod } = entry.item;
  const name = category?.name ?? "غير مصنّف";
  return {
    title: note || name,
    subtitle: `${name} · ${PAYMENT_METHOD_LABELS[paymentMethod]}`,
    icon: category?.icon ?? "❔",
    color: category?.color ?? "#94a3b8",
  };
}
