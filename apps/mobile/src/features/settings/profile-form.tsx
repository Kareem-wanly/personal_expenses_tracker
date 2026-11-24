import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { CURRENCIES } from "@masrufi/core/constants";
import { fromMinor } from "@masrufi/core/money";
import type { Profile } from "@masrufi/contracts/api/responses";

import { api } from "@/api/client";
import { useProfile } from "@/api/queries";
import { useAction } from "@/api/use-action";
import { FormLayout } from "@/features/entry/form-layout";
import { parseAmount } from "@/features/entry/money";
import type { SheetProps } from "@/features/sheets/registry";
import { Collapse } from "@/motion/collapse";
import { spacing } from "@/theme/theme";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { Field } from "@/ui/field";
import { Section } from "@/ui/section";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";

export function ProfileForm({ close }: SheetProps) {
  const me = useProfile().data;
  return (
    <>
      <SheetHeader title="الحساب" onClose={close} />
      {me ? <Form me={me} close={close} /> : null}
    </>
  );
}

function Form({ me, close }: SheetProps & { me: Profile }) {
  const [name, setName] = useState(me.name);
  const [currency, setCurrency] = useState(me.currency);
  const [budget, setBudget] = useState(me.monthlyBudget === null ? "" : String(fromMinor(me.monthlyBudget)));
  const { busy, run } = useAction();

  async function submit() {
    const changes = { name, currency, monthlyBudget: parseAmount(budget) };
    if (await run(() => api.patch<Profile>("/me", changes), "تم حفظ الإعدادات")) close();
  }

  return (
    <FormLayout footer={<Button label="حفظ" onPress={() => void submit()} busy={busy} disabled={!name.trim()} />}>
      <Field label="الاسم" value={name} onChangeText={setName} maxLength={50} />
      <Field label="ميزانية شهرية (اختياري)" inputMode="decimal" placeholder="بلا ميزانية" value={budget} onChangeText={setBudget} />
      <Section title="العملة">
        <View style={styles.currencies}>
          {CURRENCIES.map(({ code, label }) => (
            <Chip key={code} label={label} selected={code === currency} onPress={() => setCurrency(code)} />
          ))}
        </View>
        <Collapse open={currency !== me.currency}>
          <Text variant="small" color="warning">تغيير العملة لا يحوّل المبالغ المسجّلة سابقاً، بل يعرضها بالعملة الجديدة.</Text>
        </Collapse>
      </Section>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  currencies: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
