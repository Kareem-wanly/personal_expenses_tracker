import type { PaymentMethod } from "../enums";
import { addDays, monthOf, monthRange, parseISODate, shiftMonth } from "../dates";

import {
  CATEGORY_KEYWORDS,
  CURRENCY_WORDS,
  DATE_PHRASES,
  DAY_UNIT_WORDS,
  OPEN_WORDS,
  PAYMENT_WORDS,
  QUESTION_WORDS,
  SCREENS,
  SPEND_WORDS,
  STOP_WORDS,
  WEEKDAYS,
} from "./lexicon";
import { type Token, bareWord, normalizeArabic, stems, tokenize } from "./normalize";
import { type NumberSpan, classify, findNumbers } from "./numbers";

export type AssistantCategory = { id: string; name: string };

export type DraftExpense = {
  /** Major units (e.g. 12.5); null when no amount was heard. */
  amount: number | null;
  categoryId: string | null;
  date: string;
  paymentMethod: PaymentMethod;
  note: string | null;
};

export type Period = "today" | "yesterday" | "week" | "month" | "prevMonth";

export type Command =
  | { kind: "add"; items: DraftExpense[] }
  | { kind: "query"; period: Period; from: string; to: string; categoryId: string | null }
  | { kind: "open"; href: string }
  | { kind: "unknown" };

type Ctx = { today: string; categories: AssistantCategory[] };

const hasStem = (t: Token, set: Set<string> | Record<string, unknown>) =>
  stems(t.norm).some((s) => (set instanceof Set ? set.has(s) : s in set));

/* --------------------------------- Dates --------------------------------- */

/** Find a date expression; mark its tokens used. Returns YYYY-MM-DD or null. */
function findDate(tokens: Token[], used: Set<number>, today: string): string | null {
  const norms = tokens.map((t) => t.norm);

  for (const { words, offset } of DATE_PHRASES) {
    for (let i = 0; i + words.length <= norms.length; i++) {
      if (words.every((w, k) => norms[i + k] === w || stems(norms[i + k]).includes(w))) {
        words.forEach((_, k) => used.add(i + k));
        return addDays(today, offset);
      }
    }
  }

  // "قبل 3 ايام" / "قبل تلات تيام"
  for (let i = 0; i + 2 < norms.length; i++) {
    if (norms[i] !== "قبل" || !DAY_UNIT_WORDS.has(norms[i + 2])) continue;
    const n = classify(norms[i + 1]);
    if (n && (n.kind === "digits" || n.kind === "word")) {
      [i, i + 1, i + 2].forEach((k) => used.add(k));
      return addDays(today, -Math.round(n.value));
    }
  }

  // Weekday names: the most recent such day (today counts).
  for (let i = 0; i < norms.length; i++) {
    const day = stems(norms[i]).map((s) => WEEKDAYS[s] ?? WEEKDAYS[`ال${s}`]).find((d) => d !== undefined);
    if (day === undefined || !norms[i].includes("ال")) continue;
    used.add(i);
    if (i > 0 && norms[i - 1] === "يوم") used.add(i - 1);
    const dow = parseISODate(today).getDay();
    return addDays(today, -((dow - day + 7) % 7));
  }
  return null;
}

/* ------------------------------- Categories ------------------------------ */

function matchCategory(tokens: Token[], ctx: Ctx): AssistantCategory | null {
  const named = ctx.categories.map((c) => {
    const norm = normalizeArabic(c.name);
    return { c, norm, words: norm.split(/\s+/).filter((w) => w.length >= 3) };
  });
  const byDefaultName = (name: string) =>
    named.find((n) => n.norm === normalizeArabic(name))?.c ?? null;

  // Exact words first, then forms with clitics removed: "بيت" should win
  // over a stripped guess from another word.
  const passes = [tokens.map((t) => [t.norm]), tokens.map((t) => stems(t.norm))];
  for (const forms of passes) for (const ss of forms) {
    // 1) The user's own category names (whole name or one of its words).
    const own = named.find((n) => ss.includes(n.norm) || n.words.some((w) => ss.includes(w)));
    if (own) return own.c;
    // 2) Common words mapped to the default categories.
    for (const [catName, words] of Object.entries(CATEGORY_KEYWORDS)) {
      if (words.some((w) => ss.includes(w))) {
        const c = byDefaultName(catName);
        if (c) return c;
      }
    }
  }
  return null;
}

/* --------------------------------- Notes --------------------------------- */

function noteFrom(tokens: Token[], category: AssistantCategory | null): string | null {
  const words = tokens
    .filter((t) => {
      if (CURRENCY_WORDS.has(t.norm) || hasStem(t, CURRENCY_WORDS)) return false;
      if (STOP_WORDS.has(t.norm)) return false;
      if (t.norm.length < 2 && !/\d/.test(t.norm)) return false;
      return true;
    })
    .map((t) => t.raw);
  if (words.length === 0) return null;
  const note = (words.length === 1 ? bareWord(words[0]) : words.join(" ")).slice(0, 120).trim();
  if (!note) return null;
  // "20 مواصلات" → the category already says it.
  if (category && normalizeArabic(note) === normalizeArabic(category.name)) return null;
  return note;
}

/* -------------------------------- Segments ------------------------------- */

/**
 * Split the sentence into one segment per amount. Words before the first
 * amount belong to it; between two amounts, a word starting with "و"
 * ("وقهوه", "و") opens the next item, otherwise words stay with the
 * previous amount: "20 بنزين و5 قهوه" → [20 بنزين] [و5 قهوه].
 */
function segments(tokens: Token[], spans: NumberSpan[]) {
  const bounds: number[] = [0];
  for (let k = 1; k < spans.length; k++) {
    let cut = spans[k].start;
    for (let t = spans[k].start - 1; t >= spans[k - 1].end; t--) {
      if (tokens[t].norm.startsWith("و")) {
        cut = t;
        break;
      }
    }
    bounds.push(cut);
  }
  bounds.push(tokens.length);
  return spans.map((span, k) => ({ span, from: bounds[k], to: bounds[k + 1] }));
}

/* ---------------------------------- Main --------------------------------- */

function periodRange(period: Period, today: string) {
  const month = monthOf(today);
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: y };
    }
    case "week": {
      // Weeks start on Saturday, like the dashboard.
      const dow = parseISODate(today).getDay();
      return { from: addDays(today, -((dow + 1) % 7)), to: today };
    }
    case "prevMonth": {
      const r = monthRange(shiftMonth(month, -1));
      return { from: r.start, to: r.end };
    }
    default:
      return { from: monthRange(month).start, to: today };
  }
}

function findPeriod(tokens: Token[]): Period {
  const norms = tokens.map((t) => t.norm);
  const has = (w: string) => tokens.some((t) => stems(t.norm).includes(w));
  if (has("امبارح") || has("مبارح") || has("امس") || has("البارحه")) return "yesterday";
  if (has("اليوم") || norms.includes("هلق")) return "today";
  if (has("اسبوع") || has("الاسبوع") || has("جمعه")) return "week";
  if (has("شهر") || has("الشهر")) {
    const past = ["الماضي", "الماضى", "السابق", "الفايت", "المنصرم", "فات", "قبل"];
    if (past.some((w) => norms.includes(w))) return "prevMonth";
  }
  return "month";
}

/**
 * Turn a spoken or typed Arabic sentence into an app command. Pure and
 * synchronous: no network, no model — runs on the device.
 */
export function parseCommand(input: string, ctx: Ctx): Command {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { kind: "unknown" };

  const isQuestion = tokens.some((t) => QUESTION_WORDS.has(t.norm));
  const mentionsSpending = tokens.some((t) => hasStem(t, SPEND_WORDS));

  // Questions: "كم صرفت على الاكل هالشهر؟"
  if (isQuestion && mentionsSpending) {
    const period = findPeriod(tokens);
    return {
      kind: "query",
      period,
      ...periodRange(period, ctx.today),
      categoryId: matchCategory(tokens, ctx)?.id ?? null,
    };
  }

  // Navigation: "افتح التقارير"
  if (tokens.some((t) => OPEN_WORDS.has(t.norm))) {
    const screen = tokens.flatMap((t) => stems(t.norm)).find((s) => s in SCREENS);
    if (screen) return { kind: "open", href: SCREENS[screen] };
  }

  const used = new Set<number>();
  const date = findDate(tokens, used, ctx.today) ?? ctx.today;

  let paymentMethod: PaymentMethod = "cash";
  tokens.forEach((t, i) => {
    const hit = stems(t.norm).find((s) => s in PAYMENT_WORDS);
    if (hit && !used.has(i)) {
      paymentMethod = PAYMENT_WORDS[hit];
      used.add(i);
    }
  });

  const spans = findNumbers(tokens, used).filter((s) => s.value > 0 && s.value <= 1_000_000_000);

  if (spans.length === 0) {
    // "صرفت على البنزين" — understood, but the amount is missing.
    const rest = tokens.filter((_, i) => !used.has(i));
    const category = matchCategory(rest, ctx);
    if (!mentionsSpending && !category) return { kind: "unknown" };
    return {
      kind: "add",
      items: [{ amount: null, categoryId: category?.id ?? null, date, paymentMethod, note: noteFrom(rest, category) }],
    };
  }

  const items = segments(tokens, spans).map(({ span, from, to }, k) => {
    const words: Token[] = [];
    for (let i = from; i < to; i++) {
      if (used.has(i) || (i >= span.start && i < span.end)) continue;
      const t = tokens[i];
      // The "و" that joined this item to the previous one carries no meaning:
      // drop a bare "و", and unglue it from "وقهوه".
      if (k > 0 && i === from && t.norm.startsWith("و")) {
        if (t.norm === "و") continue;
        words.push({ raw: t.raw.slice(1), norm: t.norm.slice(1) });
        continue;
      }
      words.push(t);
    }
    const category = matchCategory(words, ctx);
    return {
      amount: Math.round(span.value * 100) / 100,
      categoryId: category?.id ?? null,
      date,
      paymentMethod,
      note: noteFrom(words, category),
    };
  });

  return { kind: "add", items };
}
