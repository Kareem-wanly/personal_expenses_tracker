import type { GoalDetails } from "@masrufi/contracts/api/responses";

import { useGoals, useProfile } from "@/api/queries";
import { moneyList, summarizeGoals } from "@/features/plans/summary";
import { useApproximate } from "@/features/plans/use-approximate";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import { Reveal } from "@/motion/reveal";
import { Card } from "@/ui/card";
import { LedgerRows } from "@/ui/ledger-rows";
import { PageHeader } from "@/ui/page-header";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Empty } from "@/ui/states";

import { GoalCard } from "./goal-card";

export function GoalsScreen() {
  const open = useOpenSheet();
  const goals = useGoals();
  const currency = useProfile().data?.currency ?? "USD";
  return (
    <Screen refreshing={goals.isRefetching} onRefresh={() => void goals.refetch()}>
      <PageHeader title="الأهداف" subtitle="ادّخر لما تريده خطوة بخطوة" addLabel="هدف جديد" onAdd={() => open("goal-form")} />
      <QueryView query={goals}>
        {(list) =>
          list.length === 0 ? (
            <Empty icon="🎯" title="لا أهداف بعد" hint="سيارة، سفر، عرس… حدّد المبلغ والموعد، ونحسب لك كم تدّخر كل شهر." />
          ) : (
            <Goals goals={list} currency={currency} />
          )
        }
      </QueryView>
    </Screen>
  );
}

function Goals({ goals, currency }: { goals: GoalDetails[]; currency: string }) {
  const { saved, achieved } = summarizeGoals(goals);
  const hint = useApproximate(saved, currency);
  return (
    <>
      <Reveal>
        <Card>
          <LedgerRows
            rows={[
              { label: "مدّخر لأهدافك", value: moneyList(saved) || "—", hint },
              { label: "أهداف تحقّقت", value: `${achieved} من ${goals.length}`, color: achieved ? "positive" : "muted" },
            ]}
          />
        </Card>
      </Reveal>
      {goals.map((goal, index) => (
        <Reveal key={goal.id} index={Math.min(index + 1, 5)}>
          <GoalCard goal={goal} />
        </Reveal>
      ))}
    </>
  );
}
