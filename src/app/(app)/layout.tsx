import { Suspense } from "react";

import { AppLock } from "@/components/app-lock/app-lock";
import { ExpenseContextMenu } from "@/components/expenses/expense-context-menu";
import { ExpenseFormDrawer } from "@/components/expenses/expense-form-drawer";
import { NavBar } from "@/components/layout/nav-bar";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { SwipePager } from "@/components/layout/swipe-pager";
import { TabBar } from "@/components/layout/tab-bar";
import { TabNavProvider } from "@/components/layout/tab-nav";
import { TzSync } from "@/components/layout/tz-sync";
import { WhatsNew } from "@/components/whats-new";
import { LOCK_SCRIPT } from "@/lib/app-lock";
import { requireUser } from "@/lib/dal";
import { getCategories } from "@/server/queries";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <TabNavProvider>
      {/* Decides before first paint whether the app opens locked. */}
      <script dangerouslySetInnerHTML={{ __html: LOCK_SCRIPT }} />
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col overflow-x-clip">
        <OfflineBanner />
        <NavBar />
        <SwipePager>
          <main className="px-4 pb-36 pt-safe">{children}</main>
        </SwipePager>
        <TabBar />
        {/* Session-dependent data streams in without blocking the shell. */}
        <Suspense fallback={null}>
          <ExpenseFormLoader />
        </Suspense>
        <ExpenseContextMenu />
        <Suspense fallback={null}>
          <AppLockLoader />
        </Suspense>
        <TzSync />
        <WhatsNew />
      </div>
    </TabNavProvider>
  );
}

async function ExpenseFormLoader() {
  const [user, categories] = await Promise.all([requireUser(), getCategories()]);
  return <ExpenseFormDrawer categories={categories} currency={user.currency} />;
}

async function AppLockLoader() {
  const user = await requireUser();
  return <AppLock userId={user.id} />;
}
