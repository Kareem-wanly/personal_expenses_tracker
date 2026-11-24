import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { Expense, Income } from "@masrufi/contracts/api/responses";
import { todayISO } from "@masrufi/core/dates";

import { useCategories, useProfile } from "@/api/queries";
import type { EditableEntry, EntryKind } from "@/features/ledger/entry";
import { spacing } from "@/theme/theme";
import { Button } from "@/ui/button";
import { QueryView } from "@/ui/query-view";
import { Segmented } from "@/ui/segmented";
import { Sheet } from "@/ui/sheet";
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

export function EntryScreen() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return <Sheet onClosed={leave}>{(close) => <EntrySheet close={close} />}</Sheet>;
}

/** Add or edit an expense or income. */
function EntrySheet({ close }: { close: () => void }) {
  const params = useLocalSearchParams<Params>();
  const [editing] = useState(() => readEntry(params));
  const [kind, setKind] = useState<EntryKind>(params.kind ?? "expense");
  const profile = useProfile();
  const categories = useCategories();
  const noun = kind === "income" ? "دخل" : "مصروف";

  return (
    <>
      <View style={styles.header}>
        <Button label="إلغاء" kind="plain" onPress={close} />
        <Text variant="heading" accessibilityRole="header">
          {editing ? `تعديل ${noun}` : `${noun} جديد`}
        </Text>
        <View style={styles.balance} />
      </View>
      {editing ? null : (
        <View style={styles.kinds}>
          <Segmented label="نوع العملية" options={KINDS} value={kind} onChange={setKind} />
        </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balance: { width: 80 },
  kinds: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
