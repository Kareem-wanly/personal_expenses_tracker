import { formatMoney, formatPercent } from "./money";
import { countTimes, timesBigger } from "./plural";

/**
 * Rule-based "smart insights": plain arithmetic over the user's own data —
 * no AI service, no network, no cost. Each rule returns at most one insight
 * with a priority; the UI shows the highest-priority ones.
 */

export type InsightTone = "good" | "warn" | "bad" | "info";

export type Insight = {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  priority: number;
};

export type InsightInput = {
  currency: string;
  /** Viewing the month in progress (projections only make sense then). */
  isCurrent: boolean;
  elapsedDays: number;
  totalDays: number;
  /** Spent this month so far (or the whole month for past months). */
  total: number;
  /** Previous month over the same number of days. */
  prevSamePeriod: number;
  categories: {
    id: string | null;
    name: string;
    icon: string;
    total: number;
    prevTotal: number;
    budget: number | null;
  }[];
  monthlyBudget: number | null;
  /** Income recorded this month. */
  income: number;
  /** Average spending per weekday (0 = Sunday) over recent weeks. */
  weekdayAverages: number[] | null;
  /** Most frequent notes this month. */
  repeats: { label: string; count: number; total: number }[];
  noSpendDays: number;
  /** Active recurring rules, expressed per month. */
  recurringMonthly: number;
  largest: { label: string; amount: number } | null;
  averageExpense: number;
};

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function buildInsights(i: InsightInput): Insight[] {
  const m = (v: number) => formatMoney(Math.round(v), i.currency);
  const out: Insight[] = [];
  const hasSpending = i.total > 0;

  // 1) Overall budget pace.
  if (i.monthlyBudget && hasSpending) {
    const budget = i.monthlyBudget;
    const projected = i.isCurrent && i.elapsedDays > 0 ? (i.total / i.elapsedDays) * i.totalDays : i.total;
    const daysLeft = i.totalDays - i.elapsedDays;
    if (i.total >= budget) {
      out.push({
        id: "budget-over",
        tone: "bad",
        title: "تجاوزت ميزانية الشهر",
        body: `صرفت ${m(i.total)} من أصل ${m(budget)}${i.isCurrent && daysLeft > 0 ? ` وما زال ${daysLeft} يوم` : ""}.`,
        priority: 95,
      });
    } else if (i.isCurrent && projected > budget * 1.02) {
      out.push({
        id: "budget-pace",
        tone: "warn",
        title: "بهذا المعدّل ستتجاوز ميزانيتك",
        body: `المتوقّع ${m(projected)} بنهاية الشهر. لتبقى ضمنها لا تتجاوز ${m((budget - i.total) / Math.max(daysLeft, 1))} يومياً.`,
        priority: 90,
      });
    } else if (i.isCurrent && i.elapsedDays >= 5 && projected <= budget * 0.9) {
      out.push({
        id: "budget-good",
        tone: "good",
        title: "أنت على المسار الصحيح",
        body: `بهذا المعدّل سيتبقّى حوالي ${m(budget - projected)} من ميزانيتك.`,
        priority: 60,
      });
    }
  }

  // 2) Savings from income.
  if (i.income > 0) {
    const rate = (i.income - i.total) / i.income;
    if (rate < 0) {
      out.push({
        id: "savings-negative",
        tone: "bad",
        title: "مصاريفك تجاوزت دخلك",
        body: `صرفت ${m(i.total)} مقابل دخل ${m(i.income)} — أي ${m(i.total - i.income)} زيادة هذا الشهر.`,
        priority: 88,
      });
    } else {
      out.push({
        id: "savings-rate",
        tone: rate >= 0.2 ? "good" : "info",
        title: `وفّرت ${formatPercent(rate)} من دخلك`,
        body:
          rate >= 0.2
            ? `صافي الشهر ${m(i.income - i.total)}. ممتاز — الخبراء ينصحون بادخار 20% على الأقل.`
            : `صافي الشهر ${m(i.income - i.total)}. حاول الوصول إلى 20% (${m(i.income * 0.2)}).`,
        priority: 70,
      });
    }
  }

  // 3) A category on track to exceed its own budget.
  if (i.isCurrent && i.elapsedDays > 0) {
    const atRisk = i.categories
      .filter((c) => c.budget && c.total < c.budget)
      .map((c) => ({ c, projected: (c.total / i.elapsedDays) * i.totalDays }))
      .filter(({ c, projected }) => projected > c.budget! * 1.05)
      .sort((a, b) => b.projected / b.c.budget! - a.projected / a.c.budget!)[0];
    if (atRisk) {
      out.push({
        id: `category-pace-${atRisk.c.id}`,
        tone: "warn",
        title: `«${atRisk.c.name}» في طريقه لتجاوز ميزانيته`,
        body: `صرفت ${m(atRisk.c.total)} من ${m(atRisk.c.budget!)}، والمتوقّع ${m(atRisk.projected)} بنهاية الشهر.`,
        priority: 80,
      });
    }
  }

  // 4) Biggest category increase / decrease vs the same period last month.
  const changes = i.categories
    .filter((c) => c.prevTotal > 0 && c.id)
    .map((c) => ({ c, ratio: (c.total - c.prevTotal) / c.prevTotal, diff: c.total - c.prevTotal }))
    // Ignore tiny categories so "+300% on 2 → 8" doesn't win.
    .filter(({ diff }) => Math.abs(diff) >= Math.max(i.total * 0.05, 1));
  const up = changes.filter((x) => x.ratio >= 0.25).sort((a, b) => b.diff - a.diff)[0];
  if (up) {
    out.push({
      id: `category-up-${up.c.id}`,
      tone: "warn",
      // +40% reads well as a percentage; ×13 doesn't ("أكثر بـ 1,225%").
      title:
        up.ratio < 1
          ? `صرفت على «${up.c.name}» أكثر بـ ${formatPercent(up.ratio)}`
          : `صرفت على «${up.c.name}» ${timesBigger(up.c.total / up.c.prevTotal)} ما صرفته الشهر الماضي`,
      body: `${m(up.c.total)} مقابل ${m(up.c.prevTotal)} في نفس الفترة من الشهر الماضي.`,
      priority: 65,
    });
  }
  const down = changes.filter((x) => x.ratio <= -0.25).sort((a, b) => a.diff - b.diff)[0];
  if (down) {
    out.push({
      id: `category-down-${down.c.id}`,
      tone: "good",
      title: `خفّضت «${down.c.name}» بـ ${formatPercent(Math.abs(down.ratio))}`,
      body: `${m(down.c.total)} مقابل ${m(down.c.prevTotal)} في نفس الفترة من الشهر الماضي. أحسنت!`,
      priority: 50,
    });
  }

  // 5) Small purchases that add up.
  const habit = i.repeats.find((r) => r.count >= 4);
  if (habit) {
    out.push({
      id: `habit-${habit.label}`,
      tone: "info",
      title: `«${habit.label}» تكرّر ${countTimes(habit.count)} هذا الشهر`,
      body: `بمجموع ${m(habit.total)}. تخفيفه للنصف يوفّر حوالي ${m(habit.total / 2)} شهرياً.`,
      priority: 45,
    });
  }

  // 6) Fixed commitments.
  if (i.recurringMonthly > 0 && hasSpending) {
    const share = i.recurringMonthly / Math.max(i.isCurrent ? (i.total / Math.max(i.elapsedDays, 1)) * i.totalDays : i.total, 1);
    out.push({
      id: "recurring-share",
      tone: "info",
      title: `التزامات ثابتة: ${m(i.recurringMonthly)} شهرياً`,
      body: `المصاريف المتكررة تشكّل حوالي ${formatPercent(Math.min(share, 1))} من مصروفك الشهري.`,
      priority: 25,
    });
  }

  // 7) The weekday you spend most on.
  if (i.weekdayAverages && i.weekdayAverages.some((v) => v > 0)) {
    const avgs = i.weekdayAverages;
    const top = avgs.indexOf(Math.max(...avgs));
    const others = avgs.filter((_, d) => d !== top);
    const othersAvg = others.reduce((a, b) => a + b, 0) / others.length;
    if (othersAvg > 0 && avgs[top] >= othersAvg * 1.3) {
      out.push({
        id: "weekday",
        tone: "info",
        title: `أكثر يوم تصرف فيه: ${WEEKDAYS[top]}`,
        body: `متوسط ${m(avgs[top])} مقابل ${m(othersAvg)} لباقي الأيام (آخر 12 أسبوعاً).`,
        priority: 30,
      });
    }
  }

  // 8) No-spend days (only meaningful for the month in progress).
  if (i.isCurrent && i.noSpendDays >= 3) {
    out.push({
      id: "no-spend",
      tone: "good",
      title: `${i.noSpendDays} أيام بدون مصاريف هذا الشهر`,
      body: "كل يوم بدون صرف يقرّبك من هدفك. استمر!",
      priority: 20,
    });
  }

  // 9) One unusually large expense.
  if (i.largest && i.averageExpense > 0 && i.largest.amount >= i.averageExpense * 5 && i.largest.amount >= i.total * 0.1) {
    out.push({
      id: "largest",
      tone: "info",
      title: `أكبر مصروف: ${i.largest.label}`,
      body: `${m(i.largest.amount)} — يعادل ${formatPercent(i.largest.amount / i.total)} من مصروف الشهر.`,
      priority: 15,
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
}
