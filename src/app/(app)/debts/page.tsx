import type { Metadata } from "next";
import { Suspense } from "react";

import { TabScreen } from "@/components/layout/tab-screen";
import { DebtsView } from "@/components/plans/debts-view";
import { PlansSkeleton } from "@/components/plans/plans-tiles";
import { requireUser } from "@/lib/dal";
import { getDebts } from "@/server/plans";
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
  return <DebtsView debts={debts} currency={user.currency} />;
}
