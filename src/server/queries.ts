import "server-only";

import { and, asc, between, desc, eq, like, sql, sum, count } from "drizzle-orm";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { db } from "@/db";
import { category, expense } from "@/db/schema";
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
    total: r.total ?? 0,
    count: r.count,
  }));
}

export type CategoryTotal = Awaited<ReturnType<typeof totalsByCategory>>[number];

/* -------------------------------------------------------------------------- */
/*                                 Dashboard                                  */
/* -------------------------------------------------------------------------- */

export async function getDashboardData(today: string) {
  const user = await requireUser();
  const month = monthOf(today);
  const { start, end } = monthRange(month);

  // Week starts on Saturday (common in the Arab world).
  const dow = parseISODate(today).getDay(); // 0 = Sunday … 6 = Saturday
  const weekStart = addDays(today, -((dow + 1) % 7));

  const [monthTotal, todayTotal, weekTotal, byCategory, recent] =
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
    dailyAverage: Math.round(monthTotal / dayOfMonth),
    projected: Math.round((monthTotal / dayOfMonth) * totalDays),
    daysLeft: totalDays - dayOfMonth,
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
  const { start, end } = monthRange(month);
  const prev = monthRange(shiftMonth(month, -1));
  const trendMonths = lastMonths(month, 6);
  const trendStart = `${trendMonths[0]}-01`;

  const monthCondition = and(
    eq(expense.userId, user.id),
    between(expense.date, start, end),
  );

  const [total, prevTotal, byCategory, byDayRows, top, trendRows, byMethod] =
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
  const trend = trendMonths.map((m) => ({ month: m, total: trendMap.get(m) ?? 0 }));

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
  };
}

export type MonthlyReport = Awaited<ReturnType<typeof getMonthlyReport>>;
