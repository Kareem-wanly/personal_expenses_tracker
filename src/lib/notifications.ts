import "server-only";

import { and, between, desc, eq, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { category, expense } from "@/db/schema";
import { formatMonthLabel, monthOf, monthRange, shiftMonth } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/money";
import { countExpenses } from "@/lib/plural";
import type { PushPayload } from "@/lib/push";

/** Budget thresholds that trigger an alert when crossed (ratio of budget). */
export const BUDGET_THRESHOLDS = [0.8, 1] as const;

export async function monthTotal(userId: string, month: string) {
  const { start, end } = monthRange(month);
  const [row] = await db
    .select({ total: sum(expense.amount).mapWith(Number) })
    .from(expense)
    .where(and(eq(expense.userId, userId), between(expense.date, start, end)));
  return row?.total ?? 0;
}

/**
 * Returns an alert only when this change *crossed* a threshold, so the user
 * gets one 80% alert and one 100% alert per month, not one per expense.
 */
export function budgetAlert(opts: {
  before: number;
  after: number;
  budget: number;
  currency: string;
  month: string;
}): PushPayload | null {
  const { before, after, budget, currency, month } = opts;
  if (budget <= 0 || after <= before) return null;

  const crossed = [...BUDGET_THRESHOLDS]
    .reverse()
    .find((t) => before < budget * t && after >= budget * t);
  if (!crossed) return null;

  const label = formatMonthLabel(month);
  if (crossed >= 1) {
    return {
      title: "🚨 تجاوزت ميزانية الشهر",
      body: `صرفت ${formatMoney(after, currency)} من أصل ${formatMoney(budget, currency)} في ${label}.`,
      url: "/reports",
      tag: `budget-${month}`,
    };
  }
  return {
    title: "⚠️ اقتربت من ميزانيتك",
    body: `صرفت ${formatPercent(after / budget)} من ميزانية ${label} — متبقّي ${formatMoney(budget - after, currency)}.`,
    url: "/reports",
    tag: `budget-${month}`,
  };
}

/** Same crossing rule as `budgetAlert`, for one category's own budget. */
export function categoryBudgetAlert(opts: {
  before: number;
  after: number;
  budget: number;
  currency: string;
  month: string;
  category: { id: string; name: string; icon: string };
}): PushPayload | null {
  const { before, after, budget, currency, month, category: c } = opts;
  if (budget <= 0 || after <= before) return null;
  const crossed = [...BUDGET_THRESHOLDS]
    .reverse()
    .find((t) => before < budget * t && after >= budget * t);
  if (!crossed) return null;

  const tag = `budget-${c.id}-${month}`;
  if (crossed >= 1) {
    return {
      title: `🚨 تجاوزت ميزانية ${c.icon} ${c.name}`,
      body: `صرفت ${formatMoney(after, currency)} من أصل ${formatMoney(budget, currency)} هذا الشهر.`,
      url: "/reports",
      tag,
    };
  }
  return {
    title: `⚠️ اقتربت من ميزانية ${c.icon} ${c.name}`,
    body: `صرفت ${formatPercent(after / budget)} منها — متبقّي ${formatMoney(budget - after, currency)}.`,
    url: "/reports",
    tag,
  };
}

export async function categoryMonthTotal(userId: string, categoryId: string, month: string) {
  const { start, end } = monthRange(month);
  const [row] = await db
    .select({ total: sum(expense.amount).mapWith(Number) })
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        eq(expense.categoryId, categoryId),
        between(expense.date, start, end),
      ),
    );
  return row?.total ?? 0;
}

/** Heads-up the evening before recurring expenses are added. */
export function recurringReminder(
  items: { note: string | null; categoryName: string | null; amount: number }[],
  currency: string,
): PushPayload {
  if (items.length === 1) {
    const [it] = items;
    return {
      title: "🔁 مصروف متكرر غداً",
      body: `${it.note || it.categoryName || "مصروف"}: ${formatMoney(it.amount, currency)} — سيُضاف تلقائياً.`,
      url: "/settings",
      tag: "recurring-tomorrow",
    };
  }
  const total = items.reduce((a, i) => a + i.amount, 0);
  return {
    title: "🔁 مصاريف متكررة غداً",
    body: `${countExpenses(items.length)} بمجموع ${formatMoney(total, currency)}: ${items
      .map((i) => i.note || i.categoryName)
      .filter(Boolean)
      .slice(0, 3)
      .join("، ")}.`,
    url: "/settings",
    tag: "recurring-tomorrow",
  };
}

export async function hasExpenseOn(userId: string, date: string) {
  const row = await db.query.expense.findFirst({
    where: and(eq(expense.userId, userId), eq(expense.date, date)),
    columns: { id: true },
  });
  return !!row;
}

export function dailyReminder(): PushPayload {
  return {
    title: "📝 لم تسجّل مصاريف اليوم",
    body: "سجّلها الآن قبل أن تنساها — تأخذ ثوانٍ فقط.",
    url: "/?add=1",
    tag: "daily-reminder",
  };
}

/** Summary of the month that just ended (sent on the 1st). */
export async function monthlySummary(
  userId: string,
  currency: string,
  today: string,
): Promise<PushPayload | null> {
  const month = shiftMonth(monthOf(today), -1);
  const [total, prevTotal] = await Promise.all([
    monthTotal(userId, month),
    monthTotal(userId, shiftMonth(month, -1)),
  ]);
  if (total === 0) return null;

  const { start, end } = monthRange(month);
  const [top] = await db
    .select({ name: category.name, icon: category.icon })
    .from(expense)
    .leftJoin(category, eq(expense.categoryId, category.id))
    .where(and(eq(expense.userId, userId), between(expense.date, start, end)))
    .groupBy(expense.categoryId)
    .orderBy(desc(sql`sum(${expense.amount})`))
    .limit(1);

  const parts = [`صرفت ${formatMoney(total, currency)}`];
  if (prevTotal > 0) {
    const change = (total - prevTotal) / prevTotal;
    parts.push(
      `${change > 0 ? "أكثر" : "أقل"} بـ ${formatPercent(Math.abs(change))} من الشهر السابق`,
    );
  }
  if (top?.name) parts.push(`أكبر تصنيف: ${top.icon} ${top.name}`);

  return {
    title: `📊 ملخص ${formatMonthLabel(month)}`,
    body: parts.join(" · "),
    url: `/reports?month=${month}`,
    tag: `summary-${month}`,
  };
}
