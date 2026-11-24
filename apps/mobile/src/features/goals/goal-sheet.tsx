import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { Goal, GoalDetails } from "@masrufi/contracts/api/responses";
import { formatShortDate, todayISO } from "@masrufi/core/dates";
import { formatMoney, fromMinor } from "@masrufi/core/money";

import { api } from "@/api/client";
import { useGoals, useProfile } from "@/api/queries";
import { useAction } from "@/api/use-action";
import { AmountForm } from "@/features/plans/amount-form";
import { MovementList } from "@/features/plans/movement-list";
import { SheetBody } from "@/features/plans/sheet-body";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import type { SheetProps } from "@/features/sheets/registry";
import { Confetti } from "@/motion/confetti";
import { AnimatedMoney } from "@/ui/animated-money";
import { Card } from "@/ui/card";
import { ConfirmButton } from "@/ui/confirm-button";
import { IconButton } from "@/ui/icon-button";
import { LedgerRows } from "@/ui/ledger-rows";
import { Segmented } from "@/ui/segmented";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";
import { showToast } from "@/ui/toast-store";

import { GoalMeter } from "./goal-card";

const KINDS = [
  { value: "deposit", label: "إيداع" },
  { value: "withdraw", label: "سحب" },
] as const;

type Kind = (typeof KINDS)[number]["value"];

/** A goal with its deposits and withdrawals. */
export function GoalSheet({ close }: SheetProps) {
  const open = useOpenSheet();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useGoals().data?.find((item) => item.id === id);
  const today = todayISO(useProfile().data?.timezone);
  const [kind, setKind] = useState<Kind>("deposit");
  const [celebrating, setCelebrating] = useState(false);
  const { busy, run } = useAction();
  if (!goal) return <SheetHeader title="الهدف" closeLabel="تم" onClose={close} />;

  const { name, currency, state, contributions, achievedAt } = goal;
  const path = `/goals/${id}`;
  const announce = (updated: Goal) => {
    const reached = !achievedAt && updated.achievedAt !== null;
    setCelebrating(reached);
    showToast(reached ? "🎉 حققت هدفك!" : kind === "deposit" ? "تمت إضافة المبلغ" : "تم تسجيل السحب");
  };
  const move = (amount: number) =>
    run(() => api.post<Goal>(`${path}/contributions`, { kind, amount, date: today }), announce);

  async function remove() {
    if (await run(() => api.delete(path), "تم حذف الهدف")) close();
  }

  return (
    <>
      <SheetHeader
        title={name}
        closeLabel="تم"
        onClose={close}
        action={<IconButton label="تعديل" icon="edit" onPress={() => open("goal-form", { id })} />}
      />
      <SheetBody>
        <Headline goal={goal} />
        <Figures goal={goal} />
        <AmountForm
          label={kind === "deposit" ? "مبلغ الإيداع" : "مبلغ السحب"}
          submitLabel={kind === "deposit" ? "أضف" : "اسحب"}
          placeholder={state.perMonth ? String(fromMinor(state.perMonth)) : "0"}
          busy={busy}
          onSubmit={move}
          before={<Segmented label="نوع العملية" options={KINDS} value={kind} onChange={setKind} />}
        />
        <MovementList
          title="السجلّ"
          movements={contributions}
          currency={currency}
          signed
          busy={busy}
          onDelete={(itemId) => void run(() => api.delete(`${path}/contributions/${itemId}`), "تم الحذف")}
        />
        <ConfirmButton label="حذف الهدف" title={`حذف هدف «${name}» وسجلّه؟`} disabled={busy} onConfirm={() => void remove()} />
      </SheetBody>
      {celebrating ? <Confetti /> : null}
    </>
  );
}

function Headline({ goal }: { goal: GoalDetails }) {
  const { icon, saved, target, currency, state } = goal;
  return (
    <View style={styles.headline}>
      <Text style={styles.emoji}>{icon}</Text>
      <AnimatedMoney value={saved} currency={currency} />
      <Text variant="small" color="muted">من {formatMoney(target, currency)} · {Math.round(state.ratio * 100)}%</Text>
      <View style={styles.meter}><GoalMeter goal={goal} /></View>
    </View>
  );
}

function Figures({ goal }: { goal: GoalDetails }) {
  const { currency, deadline, state } = goal;
  return (
    <Card>
      <LedgerRows
        rows={[
          { label: "المتبقّي", value: formatMoney(state.remaining, currency), color: state.achieved ? "positive" : "text" },
          ...(deadline ? [{ label: "الموعد", value: formatShortDate(deadline), color: state.late ? ("warning" as const) : ("text" as const) }] : []),
          ...(state.perMonth !== null
            ? [{ label: state.late ? "مطلوب الآن" : "المطلوب شهرياً", value: formatMoney(state.perMonth, currency) }]
            : []),
        ]}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  headline: { alignItems: "center" },
  emoji: { fontSize: 44, lineHeight: 60 },
  meter: { alignSelf: "stretch", paddingTop: 12 },
});
