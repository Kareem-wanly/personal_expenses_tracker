import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { CATEGORY_COLORS, CATEGORY_ICONS } from "@masrufi/core/constants";
import { fromMinor } from "@masrufi/core/money";

import { api } from "@/api/client";
import { useCategories } from "@/api/queries";
import { useAction } from "@/api/use-action";
import { useSave } from "@/api/use-save";
import { FormLayout } from "@/features/entry/form-layout";
import { parseAmount } from "@/features/entry/money";
import type { SheetProps } from "@/features/sheets/registry";
import { PressableScale } from "@/motion/pressable-scale";
import { radius, spacing, useColors } from "@/theme/theme";
import { Button } from "@/ui/button";
import { ConfirmButton } from "@/ui/confirm-button";
import { Field } from "@/ui/field";
import { Icon } from "@/ui/icon";
import { Section } from "@/ui/section";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";

export function CategoryForm({ close }: SheetProps) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const category = useCategories().data?.find((item) => item.id === id);
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState<string>(category?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState<string>(category?.color ?? CATEGORY_COLORS[0]);
  const [budget, setBudget] = useState(category?.budget ? String(fromMinor(category.budget)) : "");
  const { save, saving, error, fields } = useSave({ path: "/categories", id, onDone: close });
  const { busy, run } = useAction();

  const submit = () => save({ name, icon, color, budget: parseAmount(budget) });
  async function remove() {
    if (await run(() => api.delete(`/categories/${id}`), "تم حذف التصنيف")) close();
  }

  return (
    <>
      <SheetHeader title={id ? "تعديل التصنيف" : "تصنيف جديد"} onClose={close} />
      <FormLayout
        footer={
          <>
            {error && !fields.name ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
            <Button label={id ? "حفظ التعديلات" : "إضافة"} onPress={submit} busy={saving} disabled={!name.trim() || busy} />
            {id ? <ConfirmButton label="حذف" title={`حذف تصنيف «${name}»؟`} disabled={busy} onConfirm={() => void remove()} /> : null}
          </>
        }
      >
        <View style={[styles.preview, { backgroundColor: `${color}26` }]}>
          <Text style={styles.emoji}>{icon}</Text>
        </View>
        <Field label="الاسم" value={name} onChangeText={setName} maxLength={30} error={fields.name?.[0]} />
        <Field label="ميزانية شهرية (اختياري)" inputMode="decimal" placeholder="0" value={budget} onChangeText={setBudget} />
        <Section title="اللون">
          <View style={styles.choices}>
            {CATEGORY_COLORS.map((option) => (
              <Swatch key={option} color={option} selected={option === color} onPress={() => setColor(option)} />
            ))}
          </View>
        </Section>
        <Section title="الأيقونة">
          <View style={styles.choices}>
            {CATEGORY_ICONS.map((option) => (
              <IconChoice key={option} icon={option} selected={option === icon} onPress={() => setIcon(option)} />
            ))}
          </View>
        </Section>
      </FormLayout>
    </>
  );
}

type SwatchProps = { color: string; selected: boolean; onPress: () => void };

function Swatch({ color, selected, onPress }: SwatchProps) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={`اللون ${color}`}
      aria-checked={selected}
      to={0.8}
      onPress={onPress}
      style={[styles.swatch, { backgroundColor: color }]}
    >
      {selected ? <Icon name="check" color="#fff" size={18} /> : null}
    </PressableScale>
  );
}

type IconChoiceProps = { icon: string; selected: boolean; onPress: () => void };

function IconChoice({ icon, selected, onPress }: IconChoiceProps) {
  const colors = useColors();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={`الأيقونة ${icon}`}
      aria-checked={selected}
      to={0.8}
      onPress={onPress}
      style={[styles.icon, { backgroundColor: colors.card, borderColor: selected ? colors.ink : colors.hairline }]}
    >
      <Text style={styles.small}>{icon}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  preview: { alignSelf: "center", width: 84, height: 84, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 40, lineHeight: 56 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  icon: { width: 46, height: 46, borderWidth: 2, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  small: { fontSize: 21, lineHeight: 30 },
});
