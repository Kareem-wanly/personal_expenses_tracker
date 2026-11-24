import { formatMonthLabel } from "./dates";
import { formatMoney, formatPercent } from "./money";
import { countExpenses } from "./plural";

/** Texts of every notification. No sending here. */

export type PushPayload = {
  title: string;
  body: string;
  /** Page to open when the notification is tapped. */
  url?: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag?: string;
};

/** Budget thresholds that trigger an alert when crossed (ratio of budget). */
export const BUDGET_THRESHOLDS = [0.8, 1] as const;

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

/** Morning-of / day-before reminder for debts that fall due. */
export function debtReminder(
  items: { direction: "lent" | "borrowed"; person: string; remaining: number; currency: string; dueIn: number }[],
): PushPayload {
  const line = (d: (typeof items)[number]) =>
    `${d.direction === "lent" ? `لك عند ${d.person}` : `عليك لـ ${d.person}`} ${formatMoney(d.remaining, d.currency)}`;
  const when = items.every((d) => d.dueIn === 0) ? "اليوم" : items.every((d) => d.dueIn === 1) ? "غداً" : "قريباً";
  return {
    title: items.length === 1 ? `🤝 موعد سداد ${when}` : `🤝 ${items.length} ديون تستحق ${when}`,
    body: items.slice(0, 3).map(line).join("، ") + ".",
    url: "/debts",
    tag: "debts-due",
  };
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
export function monthSummary({ month, total, prevTotal, top, currency }: {
  month: string;
  total: number;
  prevTotal: number;
  top?: { name: string | null; icon: string | null };
  currency: string;
}): PushPayload {
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
