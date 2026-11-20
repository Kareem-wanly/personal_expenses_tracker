import {
  CalendarRangeIcon,
  ChevronLeftIcon,
  GaugeIcon,
  type LucideIcon,
  SunIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { PageHeader } from "@/components/layout/page-header";
import { TabScreen } from "@/components/layout/tab-screen";
import { AnimatedMoney } from "@/components/motion/animated-money";
import { BudgetRing } from "@/components/motion/budget-ring";
import { Reveal } from "@/components/motion/reveal";
import { NotificationPrompt } from "@/components/notification-prompt";
import { SpendingBreakdown } from "@/components/spending-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDayLabel, formatMonthLabel, parseISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { TAB_FORWARD } from "@/lib/tabs";
import { getDashboardData, getUserToday } from "@/server/queries";

export default function HomePage() {
  return (
    <TabScreen>
      <Suspense
        fallback={
          <ViewTransition exit="reveal-out" default="none">
            <DashboardSkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="reveal-in" default="none">
          <Dashboard />
        </ViewTransition>
      </Suspense>
    </TabScreen>
  );
}

const dateFmt = new Intl.DateTimeFormat("ar-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

async function Dashboard() {
  const today = await getUserToday();
  const d = await getDashboardData(today);
  const currency = d.user.currency;
  const firstName = d.user.name.split(" ")[0];
  const hasData = d.monthTotal > 0 || d.recent.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={dateFmt.format(parseISODate(today))}
        title={`أهلاً، ${firstName}`}
        action={
          <Link
            href="/settings"
            transitionTypes={[TAB_FORWARD]}
            aria-label="الإعدادات"
            className="pressable flex size-10 items-center justify-center rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#6e6e73] text-[15px] font-semibold text-white shadow-sm"
          >
            {firstName.slice(0, 1)}
          </Link>
        }
      />

      <Reveal index={0}>
        <MonthCard
          month={d.month}
          total={d.monthTotal}
          budget={d.user.monthlyBudget}
          daysLeft={d.daysLeft}
          currency={currency}
        />
      </Reveal>

      <NotificationPrompt hasExpenses={hasData} />

      <Reveal index={1} className="grid grid-cols-2 gap-3">
        <Stat icon={SunIcon} tint="#ff9f0a" label="اليوم" value={formatMoney(d.todayTotal, currency)} />
        <Stat
          icon={CalendarRangeIcon}
          tint="#0a84ff"
          label="هذا الأسبوع"
          value={formatMoney(d.weekTotal, currency)}
        />
        <Stat
          icon={GaugeIcon}
          tint="#bf5af2"
          label="المعدّل اليومي"
          value={formatMoney(d.dailyAverage, currency)}
        />
        <Stat
          icon={TrendingUpIcon}
          tint="#30b0c7"
          label="المتوقّع للشهر"
          value={formatMoney(d.projected, currency)}
        />
      </Reveal>

      {!hasData ? (
        <Reveal index={2}>
          <EmptyState
            icon="💸"
            title="لا توجد مصاريف بعد"
            description="ابدأ بتسجيل أول مصروف لك، وسنحسب لك كل شيء تلقائياً."
            action={<AddExpenseButton label="أضف أول مصروف" className="mt-2 h-11 rounded-full px-6" />}
          />
        </Reveal>
      ) : (
        <>
          {d.byCategory.length > 0 && (
            <Reveal as="section" index={2} className="space-y-2.5">
              <SectionTitle title="أين تذهب أموالك" href="/reports" linkLabel="التقرير" />
              <SpendingBreakdown items={d.byCategory} total={d.monthTotal} currency={currency} />
            </Reveal>
          )}

          <Reveal as="section" index={3} className="space-y-2.5">
            <SectionTitle title="آخر المصاريف" href="/expenses" linkLabel="عرض الكل" />
            <div className="surface inset-list overflow-hidden">
              {d.recent.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  currency={currency}
                  meta={formatDayLabel(e.date, today)}
                />
              ))}
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}

/** Wallet-style hero card: month total, budget ring, what's left. */
function MonthCard({
  month,
  total,
  budget,
  daysLeft,
  currency,
}: {
  month: string;
  total: number;
  budget: number | null;
  daysLeft: number;
  currency: string;
}) {
  const ratio = budget ? total / budget : 0;
  const over = !!budget && total > budget;

  return (
    <section
      aria-label="ملخّص الشهر"
      className="relative isolate overflow-hidden rounded-[28px] p-5 text-white shadow-[0_20px_44px_-18px_rgb(4_120_87/0.6)]"
    >
      {/* Layered gradients give the card depth without an image. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 100% 0%, rgb(255 255 255 / 0.28), transparent 55%)," +
            "radial-gradient(90% 80% at 0% 100%, rgb(0 60 45 / 0.55), transparent 60%)," +
            "linear-gradient(150deg, #19c27a 0%, #0c9a63 45%, #066b49 100%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 rounded-[28px] ring-1 ring-inset ring-white/15" />

      <div className="flex items-center justify-between text-[13px] font-medium text-white/80">
        <span>مصاريف {formatMonthLabel(month)}</span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] backdrop-blur">
          {daysLeft === 0 ? "آخر يوم" : `متبقّي ${daysLeft} يوم`}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <AnimatedMoney
            value={total}
            currency={currency}
            className="block text-[clamp(1.75rem,9vw,2.25rem)] font-bold leading-none tracking-tight whitespace-nowrap tabular"
          />
          {budget ? (
            <p className="mt-3 text-[14px] text-white/85">
              {over ? (
                <>
                  تجاوزت الميزانية بـ{" "}
                  <span className="font-semibold text-white">{formatMoney(total - budget, currency)}</span>
                </>
              ) : (
                <>
                  متبقّي{" "}
                  <span className="font-semibold text-white">{formatMoney(budget - total, currency)}</span>{" "}
                  من {formatMoney(budget, currency)}
                </>
              )}
            </p>
          ) : (
            <Link
              href="/settings"
              transitionTypes={[TAB_FORWARD]}
              className="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-white/90"
            >
              حدّد ميزانية شهرية
              <ChevronLeftIcon className="size-4" />
            </Link>
          )}
        </div>
        {budget ? <BudgetRing ratio={ratio} size={76} stroke={10} /> : null}
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: LucideIcon;
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex size-7 items-center justify-center rounded-full"
          style={{ backgroundColor: `${tint}1f`, color: tint }}
        >
          <Icon className="size-4" strokeWidth={2.4} />
        </span>
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2.5 truncate text-[21px] font-bold leading-tight tabular" dir="ltr">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <h2 className="text-[20px] font-bold">{title}</h2>
      <Link
        href={href}
        transitionTypes={[TAB_FORWARD]}
        className="flex items-center text-[15px] font-medium text-primary active:opacity-60"
      >
        {linkLabel}
        <ChevronLeftIcon className="size-4" />
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7" aria-busy>
      <div className="space-y-2 pb-5 pt-10">
        <Skeleton className="h-3.5 w-28 rounded-full" />
        <Skeleton className="h-8 w-40 rounded-full" />
      </div>
      <Skeleton className="h-44 rounded-[28px]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-[22px]" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-[22px]" />
    </div>
  );
}
