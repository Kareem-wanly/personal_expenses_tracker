import type { Metadata } from "next";
import { Suspense } from "react";

import { TabScreen } from "@/components/layout/tab-screen";
import { GoalsView } from "@/components/plans/goals-view";
import { PlansSkeleton } from "@/components/plans/plans-tiles";
import { requireUser } from "@/lib/dal";
import { approxTotal, getGoals } from "@/server/plans";
import { totalsByCurrency } from "@/lib/plans";
import { getUserToday } from "@/server/queries";

export const metadata: Metadata = { title: "الأهداف" };

export default function GoalsPage() {
  return (
    <TabScreen>
      <Suspense fallback={<PlansSkeleton />}>
        <Goals />
      </Suspense>
    </TabScreen>
  );
}

async function Goals() {
  const today = await getUserToday();
  const [user, goals] = await Promise.all([requireUser(), getGoals(today)]);
  const approxSaved = await approxTotal(
    totalsByCurrency(goals, (g) => ({ currency: g.currency, amount: g.saved })),
    user.currency,
  );
  return <GoalsView goals={goals} currency={user.currency} approxSaved={approxSaved} />;
}
