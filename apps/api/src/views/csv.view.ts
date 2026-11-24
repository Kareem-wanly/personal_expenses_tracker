import { INCOME_SOURCE_META, PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";
import { fromMinor } from "@masrufi/core/money";

import type { ExpenseRow } from "../models/expense.model";
import type { Income } from "../models/income.model";

const HEADER = [
  "التاريخ",
  "النوع",
  "التصنيف / المصدر",
  "المبلغ",
  "العملة",
  "طريقة الدفع",
  "ملاحظة",
  "المبلغ الأصلي",
  "العملة الأصلية",
];

/** Makes Excel read the file as UTF-8. */
const BOM = "﻿";

type Cell = string | number;
type Original = { originalAmount: number | null; originalCurrency: string | null };

/** Quoted, and never read as a formula by a spreadsheet. */
function quote(cell: Cell): string {
  const text = String(cell);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

const original = ({ originalAmount, originalCurrency }: Original): Cell[] =>
  originalCurrency && originalAmount !== null ? [fromMinor(originalAmount), originalCurrency] : ["", ""];

const expenseCells = ({ expense: e, category }: ExpenseRow, currency: string): Cell[] => [
  e.date,
  "مصروف",
  category?.name ?? "غير مصنّف",
  fromMinor(e.amount),
  currency,
  PAYMENT_METHOD_LABELS[e.paymentMethod],
  e.note ?? "",
  ...original(e),
];

const incomeCells = (i: Income, currency: string): Cell[] => [
  i.date,
  "دخل",
  INCOME_SOURCE_META[i.source].label,
  fromMinor(i.amount),
  currency,
  "",
  i.note ?? "",
  ...original(i),
];

type Entries = { currency: string; expenses: ExpenseRow[]; incomes: Income[] };

/** One sheet, newest first; the type column says which way the money went. */
export function csvView({ currency, expenses, incomes }: Entries): string {
  const rows = [
    ...expenses.map((row) => expenseCells(row, currency)),
    ...incomes.map((row) => incomeCells(row, currency)),
  ].sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  return BOM + [HEADER, ...rows].map((cells) => cells.map(quote).join(",")).join("\r\n");
}
