import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { Expense, Income } from "@masrufi/contracts/api/responses";
import { todayISO } from "@masrufi/core/dates";

import { useCategories, useProfile } from "@/api/queries";
import type { EditableEntry, EntryKind } from "@/features/ledger/entry";
import { Button } from "@/ui/button";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Segmented } from "@/ui/segmented";
import { Text } from "@/ui/text";

import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "./income-form";

const KINDS = [
  { value: "expense", label: "مصروف" },
  { value: "income", label: "دخل" },
] as const;

type Params = { kind?: EntryKind; entry?: string };

function readEntry({ kind, entry }: Params): EditableEntry | undefined {
  if (!entry) return undefined;
  return kind === "income"
    ? { kind, item: JSON.parse(entry) as Income }
    : { kind: "expense", item: JSON.parse(entry) as Expense };
}

/** Add or edit an expense or income. */
export function EntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const [editing] = useState(() => readEntry(params));
  const [kind, setKind] = useState<EntryKind>(params.kind ?? "expense");
  const profile = useProfile();
  const categories = useCategories();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const noun = kind === "income" ? "دخل" : "مصروف";
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header">
          {editing ? `تعديل ${noun}` : `${noun} جديد`}
        </Text>
        <Button label="إلغاء" kind="plain" onPress={close} />
      </View>
      {editing ? null : (
        <Segmented label="نوع العملية" options={KINDS} value={kind} onChange={setKind} />
      )}
      <QueryView query={profile}>
        {(me) => {
          const shared = { currency: me.currency, today: todayISO(me.timezone), onDone: close };
          if (kind === "income") {
            const income = editing?.kind === "income" ? editing.item : undefined;
            return <IncomeForm {...shared} income={income} />;
          }
          const expense = editing?.kind === "expense" ? editing.item : undefined;
          return (
            <QueryView query={categories}>
              {(list) => <ExpenseForm {...shared} categories={list} expense={expense} />}
            </QueryView>
          );
        }}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
