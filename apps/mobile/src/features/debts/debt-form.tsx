import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { todayISO } from "@masrufi/core/dates";
import type { DebtDirection } from "@masrufi/core/enums";
import { fromMinor } from "@masrufi/core/money";

import { useDebts, useProfile } from "@/api/queries";
import { useSave } from "@/api/use-save";
import { DayPicker } from "@/features/entry/day-picker";
import { FormLayout } from "@/features/entry/form-layout";
import { parseAmount } from "@/features/entry/money";
import { MoneyInput } from "@/features/entry/money-input";
import { OptionalDay } from "@/features/plans/optional-day";
import type { SheetProps } from "@/features/sheets/registry";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Section } from "@/ui/section";
import { Segmented } from "@/ui/segmented";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";

const DIRECTIONS: { value: DebtDirection; label: string }[] = [
  { value: "lent", label: "لي عند شخص" },
  { value: "borrowed", label: "عليّ لشخص" },
];

export function DebtForm({ close }: SheetProps) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const debt = useDebts().data?.find((item) => item.id === id);
  const me = useProfile().data;
  const today = todayISO(me?.timezone);
  const [direction, setDirection] = useState<DebtDirection>(debt?.direction ?? "lent");
  const [person, setPerson] = useState(debt?.person ?? "");
  const [money, setMoney] = useState({
    amount: debt ? String(fromMinor(debt.amount)) : "",
    currency: debt?.currency ?? me?.currency ?? "USD",
    rate: "",
  });
  const [date, setDate] = useState(debt?.date ?? today);
  const [dueDate, setDueDate] = useState(debt?.dueDate ?? null);
  const [note, setNote] = useState(debt?.note ?? "");
  const { save, saving, error, fields } = useSave({ path: "/debts", id, onDone: close });

  const amount = parseAmount(money.amount);
  const submit = () => save({ direction, person, amount, currency: money.currency, date, dueDate, note });

  return (
    <>
      <SheetHeader title={id ? "تعديل الدين" : "دين جديد"} onClose={close} />
      <FormLayout
        footer={
          <>
            {error ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
            <Button label={id ? "حفظ التعديلات" : "إضافة"} onPress={submit} busy={saving} disabled={!amount || !person.trim()} />
          </>
        }
      >
        <Segmented label="نوع الدين" options={DIRECTIONS} value={direction} onChange={setDirection} />
        <MoneyInput value={money} onChange={setMoney} userCurrency={money.currency} errors={fields} convert={false} />
        <Field label="الشخص" value={person} onChangeText={setPerson} maxLength={60} error={fields.person?.[0]} />
        <Section title="متى؟">
          <DayPicker value={date} today={today} onChange={setDate} />
        </Section>
        <Section title="موعد السداد">
          <OptionalDay value={dueDate} today={today} none="بلا موعد" onChange={setDueDate} />
        </Section>
        <Field label="ملاحظة (اختياري)" value={note} onChangeText={setNote} maxLength={120} />
      </FormLayout>
    </>
  );
}
