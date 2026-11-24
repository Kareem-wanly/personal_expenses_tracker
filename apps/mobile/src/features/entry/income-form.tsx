import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { Income } from "@masrufi/contracts/api/responses";
import { INCOME_SOURCE_META } from "@masrufi/core/constants";
import { INCOME_SOURCES, type IncomeSource } from "@masrufi/core/enums";

import { useEntryActions } from "@/features/entry-menu/use-entry-actions";
import { spacing } from "@/theme/theme";
import { Chip } from "@/ui/chip";
import { Field } from "@/ui/field";
import { Section } from "@/ui/section";

import { DayPicker } from "./day-picker";
import { FormActions } from "./form-actions";
import { FormLayout } from "./form-layout";
import { moneyOf, moneyRequest } from "./money";
import { MoneyInput } from "./money-input";
import { type Repeat, RepeatPicker } from "./repeat-picker";
import { useSave } from "./use-save";

type Props = { income?: Income; currency: string; today: string; onDone: () => void };

export function IncomeForm({ income, currency, today, onDone }: Props) {
  const isNew = !income;
  const [money, setMoney] = useState(() => moneyOf(income, currency));
  const [source, setSource] = useState<IncomeSource>(income?.source ?? "salary");
  const [date, setDate] = useState(income?.date ?? today);
  const [note, setNote] = useState(income?.note ?? "");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const { save, saving, error, fields } = useSave({
    path: "/incomes",
    id: income?.id,
    onDone,
  });

  const { remove } = useEntryActions();
  const removeEntry = () => {
    if (!income) return;
    onDone();
    void remove({ kind: "income", item: income });
  };

  const amount = moneyRequest(money, currency);
  const submit = () => save({ ...amount, source, date, note, ...(isNew && { repeat }) });

  return (
    <FormLayout
      footer={
        <FormActions
          isNew={isNew}
          canSave={amount !== null}
          onSave={submit}
          saving={saving}
          onDelete={removeEntry}
          error={error}
        />
      }
    >
      <MoneyInput value={money} onChange={setMoney} userCurrency={currency} errors={fields} />
      <Section title="المصدر">
        <View style={styles.sources}>
          {INCOME_SOURCES.map((value) => {
            const { icon, label } = INCOME_SOURCE_META[value];
            return (
              <Chip key={value} label={`${icon} ${label}`} selected={value === source} onPress={() => setSource(value)} />
            );
          })}
        </View>
      </Section>
      <Section title="التاريخ">
        <DayPicker value={date} today={today} onChange={setDate} />
      </Section>
      <Field label="ملاحظة (اختياري)" value={note} onChangeText={setNote} maxLength={120} error={fields.note?.[0]} />
      {isNew ? <RepeatPicker value={repeat} onChange={setRepeat} /> : null}
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  sources: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
