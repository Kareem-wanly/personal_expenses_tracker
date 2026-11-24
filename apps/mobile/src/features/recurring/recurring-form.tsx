import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

import type { Category, RecurringRow } from "@masrufi/contracts/api/responses";
import { todayISO } from "@masrufi/core/dates";
import { FREQUENCIES } from "@masrufi/core/enums";
import { fromMinor } from "@masrufi/core/money";
import { FREQUENCY_LABELS } from "@masrufi/core/recurrence";

import { api } from "@/api/client";
import { useCategories, useProfile, useRecurring } from "@/api/queries";
import { useAction } from "@/api/use-action";
import { useSave } from "@/api/use-save";
import { CategoryPicker } from "@/features/entry/category-picker";
import { FormLayout } from "@/features/entry/form-layout";
import { parseAmount } from "@/features/entry/money";
import { OptionalDay } from "@/features/plans/optional-day";
import type { SheetProps } from "@/features/sheets/registry";
import { Button } from "@/ui/button";
import { ConfirmButton } from "@/ui/confirm-button";
import { Field } from "@/ui/field";
import { Group, Row } from "@/ui/group";
import { Section } from "@/ui/section";
import { Segmented } from "@/ui/segmented";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";
import { Toggle } from "@/ui/toggle";

const FREQUENCY_OPTIONS = FREQUENCIES.map((value) => ({ value, label: FREQUENCY_LABELS[value] }));

export function RecurringForm({ close }: SheetProps) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rule = useRecurring().data?.find((item) => item.id === id);
  const categories = useCategories().data ?? [];
  const title = rule?.kind === "income" ? "دخل متكرر" : "مصروف متكرر";
  return (
    <>
      <SheetHeader title={title} onClose={close} />
      {rule ? <Form rule={rule} categories={categories} close={close} /> : null}
    </>
  );
}

type FormProps = SheetProps & { rule: RecurringRow; categories: Category[] };

function Form({ rule, categories, close }: FormProps) {
  const { id, kind, active, paymentMethod, source } = rule;
  const path = `/recurring/${id}`;
  const today = todayISO(useProfile().data?.timezone);
  const [amount, setAmount] = useState(String(fromMinor(rule.amount)));
  const [categoryId, setCategoryId] = useState(rule.categoryId);
  const [frequency, setFrequency] = useState(rule.frequency);
  const [nextDate, setNextDate] = useState(rule.nextDate);
  const [note, setNote] = useState(rule.note ?? "");
  const { save, saving, error, fields } = useSave({ path: "/recurring", id, onDone: close });
  const { busy, run } = useAction();

  const minor = parseAmount(amount);
  const submit = () =>
    save({ amount: minor, categoryId, note, paymentMethod, frequency, nextDate, source: source ?? undefined });
  const toggle = (on: boolean) =>
    void run(() => api.post(`${path}/${on ? "resume" : "pause"}`, {}), on ? "تم استئناف التكرار" : "تم إيقاف التكرار مؤقتاً");
  async function remove() {
    if (await run(() => api.delete(path), "تم حذف التكرار")) close();
  }

  return (
    <FormLayout
      footer={
        <>
          {error ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
          <Button label="حفظ التعديلات" onPress={submit} busy={saving} disabled={!minor || busy} />
          <ConfirmButton label="حذف" title="حذف التكرار؟ ما سُجّل سابقاً يبقى." disabled={busy} onConfirm={() => void remove()} />
        </>
      }
    >
      <Group footer={active ? undefined : "لا يُضاف شيء وهو متوقف."}>
        <Row icon="repeat" title="مفعّل" trailing={<Toggle label="مفعّل" value={active} disabled={busy} onChange={toggle} />} />
      </Group>
      <Field label="المبلغ" inputMode="decimal" value={amount} onChangeText={setAmount} error={fields.amount?.[0]} />
      <Segmented label="التكرار" options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />
      <Section title="الموعد القادم">
        <OptionalDay value={nextDate} today={today} none="اليوم" onChange={(day) => setNextDate(day ?? today)} />
        {fields.nextDate ? <Text variant="small" color="negative">{fields.nextDate[0]}</Text> : null}
      </Section>
      {kind === "expense" ? (
        <Section title="التصنيف">
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </Section>
      ) : null}
      <Field label="ملاحظة (اختياري)" value={note} onChangeText={setNote} maxLength={120} />
    </FormLayout>
  );
}
