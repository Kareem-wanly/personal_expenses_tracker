import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Command, type DraftExpense, parseCommand } from "./parse";

// Friday 20 Nov 2026; weeks start on Saturday (14 Nov).
const today = "2026-11-20";
const categories = [
  { id: "food", name: "طعام وشراب" },
  { id: "transport", name: "مواصلات" },
  { id: "bills", name: "فواتير" },
  { id: "shopping", name: "تسوّق" },
  { id: "health", name: "صحة" },
  { id: "fun", name: "ترفيه" },
  { id: "home", name: "منزل" },
  { id: "edu", name: "تعليم" },
  { id: "other", name: "أخرى" },
];
const ctx = { today, categories };

function items(input: string, c = ctx): DraftExpense[] {
  const cmd = parseCommand(input, c);
  assert.equal(cmd.kind, "add", `expected add for «${input}», got ${JSON.stringify(cmd)}`);
  return (cmd as Extract<Command, { kind: "add" }>).items;
}

function one(input: string, expected: Partial<DraftExpense>) {
  const [item, ...rest] = items(input);
  assert.equal(rest.length, 0, `expected one item for «${input}»`);
  for (const [k, v] of Object.entries(expected)) {
    assert.deepEqual(item[k as keyof DraftExpense], v, `${k} of «${input}»`);
  }
}

describe("amounts", () => {
  it("digits with currency and a keyword category", () =>
    one("صرفت 20 دولار على البنزين اليوم", {
      amount: 20,
      categoryId: "transport",
      date: today,
      paymentMethod: "cash",
      note: "بنزين",
    }));

  it("Arabic words with و", () =>
    one("قهوة بخمسة وعشرين", { amount: 25, categoryId: "food", note: "قهوة" }));

  it("Levantine hundreds", () => one("تكسي تلات ميه", { amount: 300, categoryId: "transport" }));
  it("Levantine teens", () => one("تلطعش دولار سندويشة", { amount: 13, categoryId: "food" }));
  it("MSA teens", () => one("خمسة عشر دولار غدا", { amount: 15, categoryId: "food" }));
  it("thousand and a half = 1500", () =>
    one("ايجار البيت ألف ونص دولار", { amount: 1500, categoryId: "home", note: "ايجار البيت" }));
  it("compound thousands", () => one("ميتين وخمسين الف تياب", { amount: 250_000, categoryId: "shopping" }));
  it("digits × scale word", () =>
    one("2.5 مليون ليرة تصليح سيارة", { amount: 2_500_000, categoryId: "transport", note: "تصليح سيارة" }));
  it("Arabic-Indic digits and decimal comma", () =>
    one("اشتريت دوا من الصيدلية ب ١٢٫٥", { amount: 12.5, categoryId: "health" }));
  it("thousands separator", () => one("1,500 سوبرماركت", { amount: 1500, categoryId: "food" }));
  it("Arabic-Indic digits", () => one("٢٠٠ مازوت", { amount: 200, categoryId: "transport" }));
  it("fifty thousand", () =>
    one("دفعت فاتورة الكهربا خمسين ألف ليرة امبارح بالبطاقة", {
      amount: 50_000,
      categoryId: "bills",
      date: "2026-11-19",
      paymentMethod: "card",
      note: "فاتورة الكهربا",
    }));
});

describe("several items in one sentence", () => {
  it("amount first", () => {
    const [a, b] = items("20 بنزين و5 قهوة");
    assert.deepEqual([a.amount, a.categoryId, a.note], [20, "transport", "بنزين"]);
    assert.deepEqual([b.amount, b.categoryId, b.note], [5, "food", "قهوة"]);
  });
  it("label first", () => {
    const [a, b] = items("قهوة 5 وبنزين 20");
    assert.deepEqual([a.amount, a.categoryId, a.note], [5, "food", "قهوة"]);
    assert.deepEqual([b.amount, b.categoryId, b.note], [20, "transport", "بنزين"]);
  });
  it("with prepositions and a shared date/payment", () => {
    const [a, b] = items("امبارح صرفت 30 على الغدا و 10 على التكسي بالبطاقة");
    assert.deepEqual([a.amount, a.categoryId, a.date, a.paymentMethod], [30, "food", "2026-11-19", "card"]);
    assert.deepEqual([b.amount, b.categoryId, b.date, b.paymentMethod], [10, "transport", "2026-11-19", "card"]);
  });
});

describe("dates and payment", () => {
  it("N days ago", () => one("قبل 3 أيام سينما 15", { date: "2026-11-17", amount: 15, categoryId: "fun" }));
  it("N days ago in words", () => one("قبل تلات تيام كتاب 8", { date: "2026-11-17", categoryId: "edu" }));
  it("day before yesterday", () => one("اول امبارح 10 باص", { date: "2026-11-18", amount: 10 }));
  it("weekday name", () =>
    one("يوم الخميس عشا 40 كاش", { date: "2026-11-19", amount: 40, paymentMethod: "cash", note: "عشا" }));
  it("Monday is not the number two", () => one("الاتنين 7 قهوة", { date: "2026-11-16", amount: 7 }));
  it("transfer", () => one("حولت 100 ايجار", { paymentMethod: "transfer", amount: 100, categoryId: "home" }));
});

describe("categories", () => {
  it("the user's own category wins", () => {
    const own = { today, categories: [...categories, { id: "coffee", name: "قهوة" }] };
    const [item] = items("قهوة 3", own);
    assert.equal(item.categoryId, "coffee");
    assert.equal(item.note, null); // the category already says it
  });
  it("unknown words keep the note, no category", () => one("هدية لأحمد 25", { categoryId: null, amount: 25 }));
  it("missing amount is reported, not guessed", () =>
    one("صرفت على البنزين", { amount: null, categoryId: "transport" }));
});

describe("questions and navigation", () => {
  it("this week", () =>
    assert.deepEqual(parseCommand("قديش صرفت هالأسبوع؟", ctx), {
      kind: "query",
      period: "week",
      from: "2026-11-14",
      to: today,
      categoryId: null,
    }));
  it("category this month", () =>
    assert.deepEqual(parseCommand("كم صرفت على الأكل هالشهر", ctx), {
      kind: "query",
      period: "month",
      from: "2026-11-01",
      to: today,
      categoryId: "food",
    }));
  it("last month", () => {
    const cmd = parseCommand("كم صرفت الشهر الماضي", ctx);
    assert.equal(cmd.kind, "query");
    assert.deepEqual(cmd.kind === "query" && [cmd.from, cmd.to], ["2026-10-01", "2026-10-31"]);
  });
  it("yesterday", () => {
    const cmd = parseCommand("قديش صرفت امبارح", ctx);
    assert.deepEqual(cmd.kind === "query" && [cmd.period, cmd.from], ["yesterday", "2026-11-19"]);
  });
  it("open a screen", () => assert.deepEqual(parseCommand("افتح التقارير", ctx), { kind: "open", href: "/reports" }));
  it("chit-chat is unknown", () => assert.deepEqual(parseCommand("مرحبا كيفك", ctx), { kind: "unknown" }));
});

describe("natural speech", () => {
  it("dual thousands", () => one("جبت خبز بألفين ليرة", { amount: 2000, categoryId: "food", note: "خبز" }));
  it("a verb glued to a keyword is not a category (عبيت ≠ ع + بيت)", () =>
    one("عبيت بنزين بعشرين ألف", { amount: 20_000, categoryId: "transport", note: "بنزين" }));
  it("filler words stay out of the note", () =>
    one("بدي سجل مصروف 30 دولار سوبرماركت", { amount: 30, categoryId: "food", note: "سوبرماركت" }));
  it("“شو صرفت” is a question", () =>
    assert.deepEqual(parseCommand("شو صرفت اليوم", ctx), {
      kind: "query",
      period: "today",
      from: today,
      to: today,
      categoryId: null,
    }));
  it("tens of thousands in words, cash", () =>
    one("أخدت تكسي للشغل بتلاتين ألف كاش", {
      amount: 30_000,
      categoryId: "transport",
      paymentMethod: "cash",
      note: "تكسي للشغل",
    }));
  it("hundred and twenty-five", () => one("صرفت مية وخمسة وعشرين على العشا", { amount: 125, note: "عشا" }));
  it("two items, the second without a keyword up front", () => {
    const [a, b] = items("طلبت بيتزا ب 12 دولار وبعتلي الدليفري 2");
    assert.deepEqual([a.amount, a.note], [12, "بيتزا"]);
    assert.deepEqual([b.amount, b.categoryId], [2, "food"]);
  });
});
