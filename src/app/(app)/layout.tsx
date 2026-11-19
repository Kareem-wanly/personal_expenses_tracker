import { Suspense } from "react";

import { ExpenseFormDrawer } from "@/components/expenses/expense-form-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { TzSync } from "@/components/layout/tz-sync";
import { requireUser } from "@/lib/dal";
import { getCategories } from "@/server/queries";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <OfflineBanner />
      <main className="flex-1 px-4 pb-28 pt-safe">{children}</main>
      <BottomNav />
      {/* Session-dependent data streams in without blocking the shell. */}
      <Suspense fallback={null}>
        <ExpenseFormLoader />
      </Suspense>
      <TzSync />
    </div>
  );
}

async function ExpenseFormLoader() {
  const [user, categories] = await Promise.all([requireUser(), getCategories()]);
  return <ExpenseFormDrawer categories={categories} currency={user.currency} />;
}
