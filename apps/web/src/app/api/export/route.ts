import { type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/dal";
import { MONTH_RE } from "@masrufi/core/dates";
import { fromMinor } from "@masrufi/core/money";
import { INCOME_SOURCE_META, PAYMENT_METHOD_LABELS } from "@masrufi/core/constants";
import { getExpenses, getMonthIncomes } from "@/server/queries";

/** Quote a CSV cell and neutralise spreadsheet formula injection. */
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const month = request.nextUrl.searchParams.get("month") ?? "";
  if (!MONTH_RE.test(month)) {
    return new Response("Invalid month", { status: 400 });
  }

  const [{ groups }, incomes] = await Promise.all([getExpenses({ month }), getMonthIncomes(month)]);
  // One sheet for the month: expenses and income, told apart by "النوع".
  // Amounts stay positive; the type column says which way the money went.
  // Entries typed in another currency also carry what was actually typed.
  const header = [
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
  const original = (r: { originalAmount: number | null; originalCurrency: string | null }) =>
    r.originalCurrency && r.originalAmount !== null ? [fromMinor(r.originalAmount), r.originalCurrency] : ["", ""];
  const rows: { date: string; cells: unknown[] }[] = [];

  for (const group of groups) {
    for (const e of group.items) {
      rows.push({
        date: e.date,
        cells: [
          e.date,
          "مصروف",
          e.categoryName ?? "غير مصنّف",
          fromMinor(e.amount),
          user.currency,
          PAYMENT_METHOD_LABELS[e.paymentMethod],
          e.note ?? "",
          ...original(e),
        ],
      });
    }
  }
  for (const i of incomes) {
    rows.push({
      date: i.date,
      cells: [
        i.date,
        "دخل",
        INCOME_SOURCE_META[i.source].label,
        fromMinor(i.amount),
        user.currency,
        "",
        i.note ?? "",
        ...original(i),
      ],
    });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));
  const lines = [header, ...rows.map((r) => r.cells)].map((cells) => cells.map(csvCell).join(","));

  // BOM so Excel opens UTF-8 Arabic text correctly.
  const body = "﻿" + lines.join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="masroofi-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
