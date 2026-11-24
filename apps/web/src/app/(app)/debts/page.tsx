import type { Metadata } from "next";
import { Suspense } from "react";

import { TabScreen } from "@/components/layout/tab-screen";
import { DebtsView } from "@/components/plans/debts-view";
import { PlansSkeleton } from "@/components/plans/plans-tiles";
import { requireUser } from "@/lib/dal";
import { approxTotal, getDebts } from "@/server/plans";
import { totalsByCurrency } from "@masrufi/core/plans";
import { getUserToday } from "@/server/queries";

export const metadata: Metadata = { title: "الديون" };

export default function DebtsPage() {
  return (
    <TabScreen>
      <Suspense fallback={<PlansSkeleton />}>
        <Debts />
      </Suspense>
    </TabScreen>
  );
}

async function Debts() {
  const today = await getUserToday();
  const [user, debts] = await Promise.all([requireUser(), getDebts(today)]);
  const open = debts.filter((d) => !d.state.settled);
  const left = (dir: "lent" | "borrowed") =>
    totalsByCurrency(open.filter((d) => d.direction === dir), (d) => ({ currency: d.currency, amount: d.state.remaining }));
  const [owedToMe, iOwe] = await Promise.all([
    approxTotal(left("lent"), user.currency),
    approxTotal(left("borrowed"), user.currency),
  ]);
  return <DebtsView debts={debts} currency={user.currency} approx={{ owedToMe, iOwe }} />;
}
