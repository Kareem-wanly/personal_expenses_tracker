import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";

import { parseAmount } from "@/features/entry/money";
import { spacing } from "@/theme/theme";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Field } from "@/ui/field";

type Props = {
  label: string;
  submitLabel: string;
  placeholder: string;
  busy: boolean;
  /** Answers whether it was accepted; the field is cleared then. */
  onSubmit: (amount: number) => Promise<boolean>;
  before?: ReactNode;
  after?: ReactNode;
};

/** One amount and a button: a payment, a deposit, a withdrawal. */
export function AmountForm({ label, submitLabel, placeholder, busy, onSubmit, before, after }: Props) {
  const [typed, setTyped] = useState("");
  const amount = parseAmount(typed);
  async function submit() {
    if (amount !== null && (await onSubmit(amount))) setTyped("");
  }
  return (
    <Card style={styles.card}>
      {before}
      <Field label={label} inputMode="decimal" placeholder={placeholder} value={typed} onChangeText={setTyped} />
      <View style={styles.buttons}>
        <View style={styles.button}>
          <Button label={submitLabel} onPress={() => void submit()} busy={busy} disabled={amount === null} />
        </View>
        {after ? <View style={styles.button}>{after}</View> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  buttons: { flexDirection: "row", gap: spacing.sm },
  button: { flex: 1 },
});
