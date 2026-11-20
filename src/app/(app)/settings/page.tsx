import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { TabScreen } from "@/components/layout/tab-screen";
import { CategoryManager } from "@/components/settings/category-manager";
import { InstallApp } from "@/components/settings/install-app";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/dal";
import { signOutAction } from "@/server/actions";
import { getCategoriesWithUsage } from "@/server/queries";

export const metadata: Metadata = { title: "الإعدادات" };

export default function SettingsPage() {
  return (
    <TabScreen>
      <PageHeader title="الإعدادات" />
      <div className="space-y-8">
        <Section title="الحساب">
          <Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
            <Account />
          </Suspense>
        </Section>

        <Section title="التصنيفات">
          <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
            <Categories />
          </Suspense>
        </Section>

        <Section title="الإشعارات">
          <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
            <Notifications />
          </Suspense>
        </Section>

        <Section title="المظهر">
          <ThemeSwitcher />
        </Section>

        <Section title="التطبيق">
          <InstallApp />
        </Section>

        <form action={signOutAction}>
          <Button type="submit" variant="destructive" className="h-11 w-full">
            <LogOutIcon />
            تسجيل الخروج
          </Button>
        </form>
      </div>
    </TabScreen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

async function Account() {
  const user = await requireUser();
  return (
    <div className="surface p-4">
      <p className="mb-4 truncate text-sm text-muted-foreground" dir="ltr">
        {user.email}
      </p>
      <SettingsForm
        name={user.name}
        currency={user.currency}
        monthlyBudget={user.monthlyBudget}
      />
    </div>
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
