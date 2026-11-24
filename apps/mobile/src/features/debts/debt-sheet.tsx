import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import type { Debt, DebtDetails } from "@masrufi/contracts/api/responses";
import { formatShortDate, todayISO } from "@masrufi/core/dates";
import { formatMoney, fromMinor } from "@masrufi/core/money";
import { dueLabel } from "@masrufi/core/plans";

import { api } from "@/api/client";
import { useDebts, useProfile } from "@/api/queries";
import { useAction } from "@/api/use-action";
import { AmountForm } from "@/features/plans/amount-form";
import { MovementList } from "@/features/plans/movement-list";
import { SheetBody } from "@/features/plans/sheet-body";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import type { SheetProps } from "@/features/sheets/registry";
import { useColors } from "@/theme/theme";
import { AnimatedMoney } from "@/ui/animated-money";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { ConfirmButton } from "@/ui/confirm-button";
import { IconButton } from "@/ui/icon-button";
import { LedgerRows } from "@/ui/ledger-rows";
import { Meter } from "@/ui/meter";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";
import { showToast } from "@/ui/toast-store";

/** A debt with its payments. */
export function DebtSheet({ close }: SheetProps) {
  const open = useOpenSheet();
  const { id } = useLocalSearchParams<{ id: string }>();
  const debt = useDebts().data?.find((item) => item.id === id);
  const today = todayISO(useProfile().data?.timezone);
  const { busy, run } = useAction();
  if (!debt) return <SheetHeader title="الدين" closeLabel="تم" onClose={close} />;

  const { person, currency, state, payments } = debt;
  const path = `/debts/${id}`;
  const announce = (updated: Debt) => showToast(updated.settledAt ? "تم السداد بالكامل 🎉" : "تم تسجيل الدفعة");
  const pay = (amount: number) => run(() => api.post<Debt>(`${path}/payments`, { amount, date: today }), announce);

  async function remove() {
    if (await run(() => api.delete(path), "تم حذف الدين")) close();
  }

  return (
    <>
      <SheetHeader
        title={person}
        closeLabel="تم"
        onClose={close}
        action={<IconButton label="تعديل" icon="edit" onPress={() => open("debt-form", { id })} />}
      />
      <SheetBody>
        <Headline debt={debt} />
        <Figures debt={debt} />
        {state.settled ? null : (
          <AmountForm
            label="تسجيل دفعة"
            submitLabel="تسجيل"
            placeholder={String(fromMinor(state.remaining))}
            busy={busy}
            onSubmit={pay}
            after={
              <Button
                label="سُدّد بالكامل"
                kind="plain"
                disabled={busy}
                onPress={() => void run(() => api.post<Debt>(`${path}/settle`, {}), announce)}
              />
            }
          />
        )}
        <MovementList
          title="الدفعات"
          movements={payments}
          currency={currency}
          busy={busy}
          onDelete={(paymentId) => void run(() => api.delete(`${path}/payments/${paymentId}`), "تم حذف الدفعة")}
        />
        <ConfirmButton label="حذف الدين" title={`حذف دين ${person} وكل دفعاته؟`} disabled={busy} onConfirm={() => void remove()} />
      </SheetBody>
    </>
  );
}

function Headline({ debt }: { debt: DebtDetails }) {
  const colors = useColors();
  const { direction, person, amount, currency, paid, state } = debt;
  const status = state.settled
    ? "مسدّد بالكامل ✓"
    : paid > 0
      ? `متبقٍّ من أصل ${formatMoney(amount, currency)}`
      : "لم يُسدَّد شيء بعد";
  return (
    <View style={styles.headline}>
      <Text color="muted">{direction === "lent" ? `لك عند ${person}` : `عليك لـ ${person}`}</Text>
      <AnimatedMoney value={state.settled ? amount : state.remaining} currency={currency} />
      <Text variant="small" color={state.settled ? "positive" : "muted"}>{status}</Text>
      {paid > 0 ? <View style={styles.meter}><Meter ratio={state.ratio} color={colors.positive} /></View> : null}
    </View>
  );
}

function Figures({ debt }: { debt: DebtDetails }) {
  const { amount, paid, currency, date, dueDate, note, state } = debt;
  const hint = state.settled || state.dueIn === null ? undefined : dueLabel(state.dueIn);
  return (
    <Card>
      <LedgerRows
        rows={[
          { label: "المبلغ", value: formatMoney(amount, currency) },
          { label: "المسدّد", value: formatMoney(paid, currency) },
          { label: "التاريخ", value: formatShortDate(date) },
          ...(dueDate
            ? [{ label: "موعد السداد", value: formatShortDate(dueDate), hint, color: state.overdue ? ("warning" as const) : ("text" as const) }]
            : []),
        ]}
      />
      {note ? <Text variant="small" color="muted">{note}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headline: { alignItems: "center" },
  meter: { alignSelf: "stretch", paddingTop: 12 },
});
