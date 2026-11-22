import "server-only";

import { and, asc, avg, between, count, desc, eq, isNotNull, like, max, sql, sum } from "drizzle-orm";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";

import { db } from "@/db";
import { category, expense, income, recurringExpense } from "@/db/schema";
import {
  TZ_COOKIE,
  addDays,
  daysInMonth,
  lastMonths,
  monthOf,
  monthRange,
  parseISODate,
  shiftMonth,
  todayISO,
} from "@/lib/dates";
import { requireUser } from "@/lib/dal";
import { type Insight, buildInsights } from "@/lib/insights";
import { materializeRecurring } from "@/lib/recurring";

/* -------------------------------------------------------------------------- */
/*  Every exported query resolves the user itself (DAL pattern) so a caller   */
/*  can never read another user's data by passing a different id.            */
/* -------------------------------------------------------------------------- */

export async function getUserToday(): Promise<string> {
  // "Today" depends on the request time: opt out of prerendering before
  // reading the clock (Cache Components rule).
  await connection();
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  return todayISO(tz ? decodeURIComponent(tz) : "UTC");
}

/**
 * Create any recurring expenses that fell due (rent on the 1st, weekly
 * subscriptions…) before a page reads expense data, so totals are right
 * even if the daily cron hasn't run yet. Once per request.
 */
const ensureRecurring = cache(async (userId: string) => {
  await materializeRecurring(userId, await getUserToday());
});

export async function getCategories() {
  const user = await requireUser();
  return db
    .select({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
    })
    .from(category)
    .where(eq(category.userId, user.id))
    .orderBy(asc(category.sortOrder), asc(category.createdAt));
}

export type CategoryOption = Awaited<ReturnType<typeof getCategories>>[number];

export async function getCategoriesWithUsage() {
  const user = await requireUser();
  return db
    .select({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      budget: category.budget,
      expenseCount: count(expense.id),
    })
    .from(category)
    .leftJoin(expense, eq(expense.categoryId, category.id))
    .where(eq(category.userId, user.id))
    .groupBy(category.id)
    .orderBy(asc(category.sortOrder), asc(category.createdAt));
}

const expenseSelect = {
  id: expense.id,
  amount: expense.amount,
  note: expense.note,
  date: expense.date,
  paymentMethod: expense.paymentMethod,
  categoryId: expense.categoryId,
  categoryName: category.name,
  categoryIcon: category.icon,
  categoryColor: category.color,
  recurringId: expense.recurringId,
  originalAmount: expense.originalAmount,
  originalCurrency: expense.originalCurrency,
};

export type ExpenseRow = {
  id: string;
  amount: number;
  note: string | null;
  date: string;
  paymentMethod: "cash" | "card" | "transfer";
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  recurringId: string | null;
  /** Set when typed in another currency (`amount` is converted). */
  originalAmount: number | null;
  originalCurrency: string | null;
};

async function sumBetween(userId: string, start: string, end: string) {
  const [row] = await db
    .select({ total: sum(expense.amount).mapWith(Number) })
    .from(expense)
    .where(and(eq(expense.userId, userId), between(expense.date, start, end)));
  return row?.total ?? 0;
}

async function totalsByCategory(userId: string, start: string, end: string) {
  const rows = await db
    .select({
      categoryId: expense.categoryId,
      name: category.name,
      icon: category.icon,
      color: category.color,
      budget: category.budget,
      total: sum(expense.amount).mapWith(Number),
      count: count(expense.id),
    })
    .from(expense)
    .leftJoin(category, eq(expense.categoryId, category.id))
    .where(and(eq(expense.userId, userId), between(expense.date, start, end)))
    .groupBy(expense.categoryId)
    .orderBy(desc(sum(expense.amount)));

  return rows.map((r) => ({
    categoryId: r.categoryId,
    name: r.name ?? "غير مصنّف",
    icon: r.icon ?? "❔",
    color: r.color ?? "#94a3b8",
    /** Monthly category budget (minor units), if set. */
    budget: r.budget ?? null,
    total: r.total ?? 0,
    count: r.count,
  }));
}

export type CategoryTotal = Awaited<ReturnType<typeof totalsByCategory>>[number];

const incomeSelect = {
  id: income.id,
  amount: income.amount,
  source: income.source,
  note: income.note,
  date: income.date,
  originalAmount: income.originalAmount,
  originalCurrency: income.originalCurrency,
};

export type IncomeRow = {
  id: string;
  amount: number;
  source: "salary" | "freelance" | "business" | "gift" | "investment" | "other";
  note: string | null;
  date: string;
  originalAmount: number | null;
  originalCurrency: string | null;
};

async function incomeBetween(userId: string, start: string, end: string) {
  const [row] = await db
    .select({ total: sum(income.amount).mapWith(Number) })
    .from(income)
    .where(and(eq(income.userId, userId), between(income.date, start, end)));
  return row?.total ?? 0;
}

/** All-time balance: everything earned minus everything spent, up to today. */
async function allTimeBalance(userId: string, today: string) {
  const [[inc], [exp], [any]] = await Promise.all([
    db
      .select({ total: sum(income.amount).mapWith(Number) })
      .from(income)
      .where(and(eq(income.userId, userId), sql`${income.date} <= ${today}`)),
    db
      .select({ total: sum(expense.amount).mapWith(Number) })
      .from(expense)
      .where(and(eq(expense.userId, userId), sql`${expense.date} <= ${today}`)),
    db.select({ n: count() }).from(income).where(eq(income.userId, userId)),
  ]);
  return {
    hasIncome: (any?.n ?? 0) > 0,
    balance: (inc?.total ?? 0) - (exp?.total ?? 0),
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Dashboard                                  */
/* -------------------------------------------------------------------------- */

export async function getDashboardData(today: string) {
  const user = await requireUser();
  await ensureRecurring(user.id);
  const month = monthOf(today);
  const { start, end } = monthRange(month);

  // Week starts on Saturday (common in the Arab world).
  const dow = parseISODate(today).getDay(); // 0 = Sunday … 6 = Saturday
  const weekStart = addDays(today, -((dow + 1) % 7));

  const [monthTotal, todayTotal, weekTotal, byCategory, recent, monthIncome, balance] =
    await Promise.all([
      sumBetween(user.id, start, end),
      sumBetween(user.id, today, today),
      sumBetween(user.id, weekStart, today),
      totalsByCategory(user.id, start, end),
      db
        .select(expenseSelect)
        .from(expense)
        .leftJoin(category, eq(expense.categoryId, category.id))
        .where(eq(expense.userId, user.id))
        .orderBy(desc(expense.date), desc(expense.createdAt))
        .limit(6),
      incomeBetween(user.id, start, end),
      allTimeBalance(user.id, today),
    ]);

  const dayOfMonth = Number(today.slice(8, 10));
  const totalDays = daysInMonth(month);

  return {
    user,
    month,
    monthTotal,
    todayTotal,
    weekTotal,
    byCategory,
    recent: recent as ExpenseRow[],
    monthIncome,
    hasIncome: balance.hasIncome,
    balance: balance.balance,
    dailyAverage: Math.round(monthTotal / dayOfMonth),
    projected: Math.round((monthTotal / dayOfMonth) * totalDays),
    daysLeft: totalDays - dayOfMonth,
    /** Share of the month elapsed (for the budget pace notch). */
    pace: dayOfMonth / totalDays,
  };
}

/* -------------------------------------------------------------------------- */
/*                                Expense list                                */
/* -------------------------------------------------------------------------- */

export async function getExpenses(filters: {
  month: string;
  q?: string;
  categoryId?: string;
}) {
  const user = await requireUser();
  await ensureRecurring(user.id);
  const { start, end } = monthRange(filters.month);

  const conditions = [
    eq(expense.userId, user.id),
    between(expense.date, start, end),
  ];
  if (filters.categoryId === "none") {
    conditions.push(sql`${expense.categoryId} is null`);
  } else if (filters.categoryId) {
    conditions.push(eq(expense.categoryId, filters.categoryId));
  }
  if (filters.q) {
    // Escape LIKE wildcards in user input.
    const q = filters.q.replace(/[\\%_]/g, (m) => `\\${m}`);
    conditions.push(sql`${like(expense.note, `%${q}%`)} escape '\\'`);
  }

  const rows = (await db
    .select(expenseSelect)
    .from(expense)
    .leftJoin(category, eq(expense.categoryId, category.id))
    .where(and(...conditions))
    .orderBy(desc(expense.date), desc(expense.createdAt))) as ExpenseRow[];

  // Group by day, preserving order.
  const groups: { date: string; total: number; items: ExpenseRow[] }[] = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (last && last.date === row.date) {
      last.items.push(row);
      last.total += row.amount;
    } else {
      groups.push({ date: row.date, total: row.amount, items: [row] });
    }
  }

  return {
    currency: user.currency,
    total: rows.reduce((acc, r) => acc + r.amount, 0),
    count: rows.length,
    groups,
  };
}

/* -------------------------------------------------------------------------- */
/*                               Monthly report                               */
/* -------------------------------------------------------------------------- */

export async function getMonthlyReport(month: string, today: string) {
  const user = await requireUser();
  await ensureRecurring(user.id);
  const { start, end } = monthRange(month);
  const prev = monthRange(shiftMonth(month, -1));
  const trendMonths = lastMonths(month, 6);
  const trendStart = `${trendMonths[0]}-01`;

  const monthCondition = and(
    eq(expense.userId, user.id),
    between(expense.date, start, end),
  );

  const [total, prevTotal, byCategory, byDayRows, top, trendRows, byMethod, incomes, incomeTrendRows] =
    await Promise.all([
      sumBetween(user.id, start, end),
      sumBetween(user.id, prev.start, prev.end),
      totalsByCategory(user.id, start, end),
      db
        .select({
          date: expense.date,
          total: sum(expense.amount).mapWith(Number),
        })
        .from(expense)
        .where(monthCondition)
        .groupBy(expense.date),
      db
        .select(expenseSelect)
        .from(expense)
        .leftJoin(category, eq(expense.categoryId, category.id))
        .where(monthCondition)
        .orderBy(desc(expense.amount))
        .limit(5),
      db
        .select({
          month: sql<string>`substr(${expense.date}, 1, 7)`,
          total: sum(expense.amount).mapWith(Number),
        })
        .from(expense)
        .where(
          and(eq(expense.userId, user.id), between(expense.date, trendStart, end)),
        )
        .groupBy(sql`substr(${expense.date}, 1, 7)`),
      db
        .select({
          method: expense.paymentMethod,
          total: sum(expense.amount).mapWith(Number),
        })
        .from(expense)
        .where(monthCondition)
        .groupBy(expense.paymentMethod),
      db
        .select(incomeSelect)
        .from(income)
        .where(and(eq(income.userId, user.id), between(income.date, start, end)))
        .orderBy(desc(income.date), desc(income.createdAt)),
      db
        .select({
          month: sql<string>`substr(${income.date}, 1, 7)`,
          total: sum(income.amount).mapWith(Number),
        })
        .from(income)
        .where(and(eq(income.userId, user.id), between(income.date, trendStart, end)))
        .groupBy(sql`substr(${income.date}, 1, 7)`),
    ]);

  const totalDays = daysInMonth(month);
  const isCurrent = month === monthOf(today);
  const isFuture = month > monthOf(today);
  const elapsedDays = isFuture
    ? 0
    : isCurrent
      ? Number(today.slice(8, 10))
      : totalDays;

  const dayMap = new Map(byDayRows.map((r) => [r.date, r.total ?? 0]));
  const daily = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    return { day, date, total: dayMap.get(date) ?? 0 };
  });

  const trendMap = new Map(trendRows.map((r) => [r.month, r.total ?? 0]));
  const incomeTrendMap = new Map(incomeTrendRows.map((r) => [r.month, r.total ?? 0]));
  const trend = trendMonths.map((m) => ({
    month: m,
    total: trendMap.get(m) ?? 0,
    income: incomeTrendMap.get(m) ?? 0,
  }));
  const incomeTotal = incomes.reduce((a, r) => a + r.amount, 0);

  const spendingDays = daily.filter((d) => d.total > 0).length;
  const maxDay = daily.reduce((a, b) => (b.total > a.total ? b : a), daily[0]);

  return {
    user,
    month,
    total,
    prevTotal,
    change: prevTotal > 0 ? (total - prevTotal) / prevTotal : null,
    count: byCategory.reduce((a, c) => a + c.count, 0),
    byCategory,
    daily,
    trend,
    top: top as ExpenseRow[],
    byMethod: byMethod.map((m) => ({ method: m.method, total: m.total ?? 0 })),
    dailyAverage: elapsedDays > 0 ? Math.round(total / elapsedDays) : 0,
    projected:
      isCurrent && elapsedDays > 0
        ? Math.round((total / elapsedDays) * totalDays)
        : null,
    spendingDays,
    maxDay: maxDay.total > 0 ? maxDay : null,
    isCurrent,
    incomes: incomes as IncomeRow[],
    incomeTotal,
    net: incomeTotal - total,
  };
}

export type MonthlyReport = Awaited<ReturnType<typeof getMonthlyReport>>;

/* -------------------------------------------------------------------------- */
/*                             Recurring expenses                             */
/* -------------------------------------------------------------------------- */

export async function getRecurring() {
  const user = await requireUser();
  return db
    .select({
      id: recurringExpense.id,
      amount: recurringExpense.amount,
      note: recurringExpense.note,
      paymentMethod: recurringExpense.paymentMethod,
      frequency: recurringExpense.frequency,
      nextDate: recurringExpense.nextDate,
      active: recurringExpense.active,
      kind: recurringExpense.kind,
      source: recurringExpense.source,
      categoryId: recurringExpense.categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(recurringExpense)
    .leftJoin(category, eq(recurringExpense.categoryId, category.id))
    .where(eq(recurringExpense.userId, user.id))
    .orderBy(desc(recurringExpense.active), asc(recurringExpense.nextDate));
}

export type RecurringRow = Awaited<ReturnType<typeof getRecurring>>[number];

/* -------------------------------------------------------------------------- */
/*                               Smart insights                               */
/* -------------------------------------------------------------------------- */

/**
 * Gather the numbers the rule-based insight engine needs. For the month in
 * progress, comparisons use the *same number of days* of the previous month
 * so that "day 10 vs a full month" never looks like a 70% drop.
 */
export async function getInsights(month: string, today: string): Promise<Insight[]> {
  const user = await requireUser();
  await ensureRecurring(user.id);

  const totalDays = daysInMonth(month);
  const isCurrent = month === monthOf(today);
  if (month > monthOf(today)) return [];
  const elapsedDays = isCurrent ? Number(today.slice(8, 10)) : totalDays;
  const start = `${month}-01`;
  const end = isCurrent ? today : monthRange(month).end;

  const prevMonth = shiftMonth(month, -1);
  const prevStart = `${prevMonth}-01`;
  const prevEnd = isCurrent
    ? `${prevMonth}-${String(Math.min(elapsedDays, daysInMonth(prevMonth))).padStart(2, "0")}`
    : monthRange(prevMonth).end;

  // Weekday pattern over the last 12 full weeks.
  const patternEnd = isCurrent ? today : end;
  const patternStart = addDays(patternEnd, -83);

  const period = and(eq(expense.userId, user.id), between(expense.date, start, end));

  const [
    total,
    prevSamePeriod,
    cats,
    prevCats,
    monthIncome,
    days,
    repeats,
    spendDays,
    rules,
    stats,
    largestRow,
  ] = await Promise.all([
    sumBetween(user.id, start, end),
    sumBetween(user.id, prevStart, prevEnd),
    totalsByCategory(user.id, start, end),
    db
      .select({ categoryId: expense.categoryId, total: sum(expense.amount).mapWith(Number) })
      .from(expense)
      .where(and(eq(expense.userId, user.id), between(expense.date, prevStart, prevEnd)))
      .groupBy(expense.categoryId),
    incomeBetween(user.id, `${month}-01`, monthRange(month).end),
    db
      .select({ date: expense.date, total: sum(expense.amount).mapWith(Number) })
      .from(expense)
      .where(and(eq(expense.userId, user.id), between(expense.date, patternStart, patternEnd)))
      .groupBy(expense.date),
    db
      .select({
        label: sql<string>`trim(${expense.note})`,
        count: count(),
        total: sum(expense.amount).mapWith(Number),
      })
      .from(expense)
      .where(and(period, isNotNull(expense.note), sql`trim(${expense.note}) <> ''`))
      .groupBy(sql`trim(${expense.note})`)
      .orderBy(desc(count()))
      .limit(3),
    db
      .select({ n: sql<number>`count(distinct ${expense.date})` })
      .from(expense)
      .where(period),
    db
      .select({ amount: recurringExpense.amount, frequency: recurringExpense.frequency })
      .from(recurringExpense)
      .where(
        and(
          eq(recurringExpense.userId, user.id),
          eq(recurringExpense.active, true),
          eq(recurringExpense.kind, "expense"),
        ),
      ),
    db
      .select({ avg: avg(expense.amount).mapWith(Number), max: max(expense.amount) })
      .from(expense)
      .where(period),
    db
      .select({ note: expense.note, amount: expense.amount, categoryName: category.name })
      .from(expense)
      .leftJoin(category, eq(category.id, expense.categoryId))
      .where(period)
      .orderBy(desc(expense.amount))
      .limit(1),
  ]);

  // Average spend per weekday occurrence (12 occurrences each in 84 days).
  const weekdayTotals = Array<number>(7).fill(0);
  for (const d of days) weekdayTotals[parseISODate(d.date).getDay()] += d.total ?? 0;
  const hasPattern = days.length >= 14;

  const prevByCat = new Map(prevCats.map((r) => [r.categoryId, r.total ?? 0]));
  const recurringMonthly = rules.reduce(
    (a, r) => a + (r.frequency === "weekly" ? (r.amount * 52) / 12 : r.frequency === "yearly" ? r.amount / 12 : r.amount),
    0,
  );
  const largest = largestRow[0];

  return buildInsights({
    currency: user.currency,
    isCurrent,
    elapsedDays,
    totalDays,
    total,
    prevSamePeriod,
    categories: cats.map((c) => ({
      id: c.categoryId,
      name: c.name,
      icon: c.icon,
      total: c.total,
      prevTotal: prevByCat.get(c.categoryId) ?? 0,
      budget: c.budget,
    })),
    monthlyBudget: user.monthlyBudget,
    income: monthIncome,
    weekdayAverages: hasPattern ? weekdayTotals.map((t) => t / 12) : null,
    repeats: repeats.map((r) => ({ label: r.label, count: r.count, total: r.total ?? 0 })),
    noSpendDays: Math.max(elapsedDays - (spendDays[0]?.n ?? 0), 0),
    recurringMonthly,
    largest: largest
      ? { label: largest.note || largest.categoryName || "مصروف", amount: largest.amount }
      : null,
    averageExpense: stats[0]?.avg ?? 0,
  });
}

/** Income entries of one month, newest first (CSV export). */
export async function getMonthIncomes(month: string): Promise<IncomeRow[]> {
  const user = await requireUser();
  await ensureRecurring(user.id);
  const { start, end } = monthRange(month);
  return (await db
    .select(incomeSelect)
    .from(income)
    .where(and(eq(income.userId, user.id), between(income.date, start, end)))
    .orderBy(desc(income.date), desc(income.createdAt))) as IncomeRow[];
}
