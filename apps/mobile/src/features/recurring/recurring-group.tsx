import type { RecurringRow } from "@masrufi/contracts/api/responses";
import { INCOME_SOURCE_META } from "@masrufi/core/constants";
import { formatShortDate } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";
import { FREQUENCY_LABELS } from "@masrufi/core/recurrence";

import { useRecurring } from "@/api/queries";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import { Group, Row } from "@/ui/group";
import { Text } from "@/ui/text";

import { describeRule, monthlyExpenses } from "./rule";

const EMPTY = "عند إضافة مصروف أو دخل اختر «التكرار» ليُضاف تلقائياً في موعده، مثل الإيجار والاشتراكات والراتب.";

export function RecurringGroup({ currency }: { currency: string }) {
  const rules = useRecurring().data ?? [];
  const total = formatMoney(monthlyExpenses(rules), currency);
  const footer = rules.length ? `المصاريف الثابتة تعادل ${total} شهرياً.` : EMPTY;
  return (
    <Group title="المتكرر (مصاريف ودخل)" footer={footer}>
      {rules.length === 0 ? <Row icon="repeat" title="لا يوجد شيء متكرر بعد" color="muted" /> : null}
      {rules.map((rule) => (
        <RuleRow key={rule.id} rule={rule} currency={currency} />
      ))}
    </Group>
  );
}

function RuleRow({ rule, currency }: { rule: RecurringRow; currency: string }) {
  const open = useOpenSheet();
  const income = rule.kind === "income";
  const when = rule.active ? `القادم ${formatShortDate(rule.nextDate)}` : "متوقف مؤقتاً";
  const icon = income ? INCOME_SOURCE_META[rule.source ?? "salary"].icon : (rule.category?.icon ?? "❔");
  return (
    <Row
      emoji={icon}
      title={describeRule(rule)}
      subtitle={`${FREQUENCY_LABELS[rule.frequency]} · ${when}`}
      faded={!rule.active}
      trailing={<Text variant="strong" color={income ? "positive" : "text"}>{formatMoney(rule.amount, currency)}</Text>}
      onPress={() => open("recurring", { id: rule.id })}
    />
  );
}
