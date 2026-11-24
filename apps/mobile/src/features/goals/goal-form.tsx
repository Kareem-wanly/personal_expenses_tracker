import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { todayISO } from "@masrufi/core/dates";
import { fromMinor } from "@masrufi/core/money";

import { useGoals, useProfile } from "@/api/queries";
import { useSave } from "@/api/use-save";
import { FormLayout } from "@/features/entry/form-layout";
import { parseAmount } from "@/features/entry/money";
import { MoneyInput } from "@/features/entry/money-input";
import { OptionalDay } from "@/features/plans/optional-day";
import type { SheetProps } from "@/features/sheets/registry";
import { spacing } from "@/theme/theme";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { Field } from "@/ui/field";
import { Section } from "@/ui/section";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";

const ICONS = ["🎯", "🚗", "✈️", "🏠", "💍", "📱", "💻", "🎓", "🕋", "👶", "🏥", "💰"];

export function GoalForm({ close }: SheetProps) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goal = useGoals().data?.find((item) => item.id === id);
  const me = useProfile().data;
  const [name, setName] = useState(goal?.name ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? ICONS[0]);
  const [money, setMoney] = useState({
    amount: goal ? String(fromMinor(goal.target)) : "",
    currency: goal?.currency ?? me?.currency ?? "USD",
    rate: "",
  });
  const [initial, setInitial] = useState("");
  const [deadline, setDeadline] = useState(goal?.deadline ?? null);
  const { save, saving, error, fields } = useSave({ path: "/goals", id, onDone: close });

  const target = parseAmount(money.amount);
  const submit = () =>
    save({ name, icon, target, currency: money.currency, deadline, ...(id ? {} : { initial: parseAmount(initial) }) });

  return (
    <>
      <SheetHeader title={id ? "تعديل الهدف" : "هدف جديد"} onClose={close} />
      <FormLayout
        footer={
          <>
            {error ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
            <Button label={id ? "حفظ التعديلات" : "إضافة"} onPress={submit} busy={saving} disabled={!target || !name.trim()} />
          </>
        }
      >
        <MoneyInput value={money} onChange={setMoney} userCurrency={money.currency} errors={fields} convert={false} />
        <Field label="اسم الهدف" value={name} onChangeText={setName} maxLength={40} error={fields.name?.[0]} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.icons}>
          {ICONS.map((option) => (
            <Chip key={option} label={option} selected={option === icon} onPress={() => setIcon(option)} />
          ))}
        </ScrollView>
        <Section title="الموعد">
          <OptionalDay value={deadline} today={todayISO(me?.timezone)} none="بلا موعد" onChange={setDeadline} />
        </Section>
        {id ? null : (
          <Field label="المدّخر حالياً (اختياري)" inputMode="decimal" placeholder="0" value={initial} onChangeText={setInitial} />
        )}
      </FormLayout>
    </>
  );
}

const styles = StyleSheet.create({ icons: { gap: spacing.sm } });
