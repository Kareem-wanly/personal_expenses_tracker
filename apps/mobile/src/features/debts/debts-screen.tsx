import { useState } from "react";

import type { DebtDetails } from "@masrufi/contracts/api/responses";

import { useDebts, useProfile } from "@/api/queries";
import { moneyList, summarizeDebts } from "@/features/plans/summary";
import { useApproximate } from "@/features/plans/use-approximate";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import { Collapse } from "@/motion/collapse";
import { Reveal } from "@/motion/reveal";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { PageHeader } from "@/ui/page-header";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Section } from "@/ui/section";
import { Empty } from "@/ui/states";

import { DebtItem } from "./debt-item";

export function DebtsScreen() {
  const open = useOpenSheet();
  const debts = useDebts();
  const currency = useProfile().data?.currency ?? "USD";
  return (
    <Screen refreshing={debts.isRefetching} onRefresh={() => void debts.refetch()}>
      <PageHeader title="الديون" subtitle="ما لك عند الناس وما عليك لهم" addLabel="دين جديد" onAdd={() => open("debt-form")} />
      <QueryView query={debts}>
        {(list) =>
          list.length === 0 ? (
            <Empty icon="🤝" title="لا ديون مسجّلة" hint="سجّل ما أقرضته لغيرك أو اقترضته منهم، وسنذكّرك قبل موعد السداد." />
          ) : (
            <Debts debts={list} currency={currency} />
          )
        }
      </QueryView>
    </Screen>
  );
}

function Debts({ debts, currency }: { debts: DebtDetails[]; currency: string }) {
  const { lent, borrowed, settled, overdue, owedToMe, iOwe } = summarizeDebts(debts);
  const [showSettled, setShowSettled] = useState(false);
  const owedHint = useApproximate(owedToMe, currency);
  const oweHint = useApproximate(iOwe, currency);
  return (
    <>
      <Reveal>
        <Card>
          <LedgerRows
            rows={[
              { label: "لك عند الآخرين", value: moneyList(owedToMe) || "—", hint: owedHint, color: lent.length ? "positive" : "muted" },
              { label: "عليك للآخرين", value: moneyList(iOwe) || "—", hint: oweHint, color: borrowed.length ? "negative" : "muted" },
              ...(overdue > 0
                ? [{ label: "متأخرة عن موعدها", value: String(overdue), color: "warning" as const }]
                : []),
            ]}
          />
        </Card>
      </Reveal>
      <DebtSection title="لك" debts={lent} index={1} />
      <DebtSection title="عليك" debts={borrowed} index={2} />
      {settled.length > 0 ? (
        <Reveal index={3}>
          <Section
            title={`مسدّدة (${settled.length})`}
            link={showSettled ? "إخفاء" : "عرض"}
            onPressLink={() => setShowSettled(!showSettled)}
          >
            <Collapse open={showSettled}>
              <DebtCard debts={settled} />
            </Collapse>
          </Section>
        </Reveal>
      ) : null}
    </>
  );
}

function DebtSection({ title, debts, index }: { title: string; debts: DebtDetails[]; index: number }) {
  if (debts.length === 0) return null;
  return (
    <Reveal index={index}>
      <Section title={title}>
        <DebtCard debts={debts} />
      </Section>
    </Reveal>
  );
}

function DebtCard({ debts }: { debts: DebtDetails[] }) {
  return (
    <Card>
      {debts.map((debt) => (
        <DebtItem key={debt.id} debt={debt} />
      ))}
    </Card>
  );
}
