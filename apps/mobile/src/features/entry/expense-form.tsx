import { useState } from "react";

import type { Category, Expense } from "@masrufi/contracts/api/responses";
import { PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";
import { PAYMENT_METHODS, type PaymentMethod } from "@masrufi/core/enums";
import type { DraftExpense } from "@masrufi/core/quick-add/parse";

import { Field } from "@/ui/field";
import { Section } from "@/ui/section";
import { Segmented } from "@/ui/segmented";

import { CategoryPicker } from "./category-picker";
import { DayPicker } from "./day-picker";
import { FormActions } from "./form-actions";
import { moneyOf, moneyRequest } from "./money";
import { MoneyInput } from "./money-input";
import { QuickAdd } from "./quick-add";
import { type Repeat, RepeatPicker } from "./repeat-picker";
import { useSave } from "./use-save";

const METHODS = PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

type Props = {
  expense?: Expense;
  categories: Category[];
  currency: string;
  today: string;
  onDone: () => void;
};

export function ExpenseForm({ expense, categories, currency, today, onDone }: Props) {
  const isNew = !expense;
  const [money, setMoney] = useState(() => moneyOf(expense, currency));
  const [categoryId, setCategoryId] = useState<string | null>(
    expense ? expense.categoryId : (categories[0]?.id ?? null),
  );
  const [date, setDate] = useState(expense?.date ?? today);
  const [method, setMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? "cash");
  const [note, setNote] = useState(expense?.note ?? "");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const { save, remove, saving, removing, error, fields } = useSave({
    path: "/expenses",
    id: expense?.id,
    onDone,
  });

  function fill(draft: DraftExpense) {
    setMoney({ amount: draft.amount === null ? "" : String(draft.amount), currency, rate: "" });
    if (draft.categoryId) setCategoryId(draft.categoryId);
    setDate(draft.date);
    setMethod(draft.paymentMethod);
    setNote(draft.note ?? "");
  }

  const amount = moneyRequest(money, currency);
  const submit = () =>
    save({ ...amount, categoryId, date, paymentMethod: method, note, ...(isNew && { repeat }) });

  return (
    <>
      {isNew ? <QuickAdd categories={categories} today={today} currency={currency} onDraft={fill} onDone={onDone} /> : null}
      <MoneyInput value={money} onChange={setMoney} userCurrency={currency} errors={fields} />
      <Section title="التصنيف">
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      </Section>
      <Section title="التاريخ">
        <DayPicker value={date} today={today} onChange={setDate} />
      </Section>
      <Segmented label="طريقة الدفع" options={METHODS} value={method} onChange={setMethod} />
      <Field label="ملاحظة (اختياري)" value={note} onChangeText={setNote} maxLength={120} error={fields.note?.[0]} />
      {isNew ? <RepeatPicker value={repeat} onChange={setRepeat} /> : null}
      <FormActions
        isNew={isNew}
        canSave={amount !== null}
        onSave={submit}
        saving={saving}
        onDelete={remove}
        removing={removing}
        error={error}
      />
    </>
  );
}
