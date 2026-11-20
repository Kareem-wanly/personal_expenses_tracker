import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { TabScreen } from "@/components/layout/tab-screen";
import { Reveal } from "@/components/motion/reveal";
import { CategoryManager } from "@/components/settings/category-manager";
import { InstallApp } from "@/components/settings/install-app";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Group, RowButton } from "@/components/ui/grouped-list";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/constants";
import { requireUser } from "@/lib/dal";
import { signOutAction } from "@/server/actions";
import { getCategoriesWithUsage } from "@/server/queries";

export const metadata: Metadata = { title: "الإعدادات" };

export default function SettingsPage() {
  return (
    <TabScreen>
      <PageHeader title="الإعدادات" />
      <div className="space-y-7">
        <Suspense fallback={<Skeleton className="h-[260px] rounded-[22px]" />}>
          <Account />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-96 rounded-[22px]" />}>
          <Reveal index={1}>
            <Categories />
          </Reveal>
        </Suspense>

        <Suspense fallback={<Skeleton className="h-64 rounded-[22px]" />}>
          <Reveal index={2}>
            <Notifications />
          </Reveal>
        </Suspense>

        <Reveal index={3}>
          <ThemeSwitcher />
        </Reveal>

        <Reveal index={4}>
          <InstallApp />
        </Reveal>

        <Reveal index={5}>
          <form action={signOutAction}>
            <Group>
              <RowButton
                type="submit"
                center
                className="text-destructive"
                title={
                  <span className="flex items-center gap-2">
                    <LogOutIcon className="size-[18px]" />
                    تسجيل الخروج
                  </span>
                }
              />
            </Group>
          </form>
          <p className="mt-6 text-center text-[12px] text-muted-foreground">{APP_NAME}</p>
        </Reveal>
      </div>
    </TabScreen>
  );
}

async function Account() {
  const user = await requireUser();
  const initial = user.name.trim().slice(0, 1) || "؟";
  return (
    <Reveal index={0} className="space-y-6">
      {/* Profile card, like the Apple ID header in Settings. */}
      <div className="surface flex items-center gap-4 p-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#6e6e73] text-[28px] font-semibold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[20px] font-semibold">{user.name}</p>
          <p className="truncate text-[14px] text-muted-foreground" dir="ltr">
            {user.email}
          </p>
        </div>
      </div>
      <SettingsForm name={user.name} currency={user.currency} monthlyBudget={user.monthlyBudget} />
    </Reveal>
  );
}

async function Notifications() {
  const user = await requireUser();
  return (
    <NotificationSettings
      prefs={{
        notifyBudget: user.notifyBudget,
        notifyDailyReminder: user.notifyDailyReminder,
        notifyMonthlySummary: user.notifyMonthlySummary,
      }}
    />
  );
}

async function Categories() {
  const categories = await getCategoriesWithUsage();
  return <CategoryManager categories={categories} />;
}
