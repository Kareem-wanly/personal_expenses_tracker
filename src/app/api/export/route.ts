import { type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/dal";
import { MONTH_RE } from "@/lib/dates";
import { fromMinor } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { getExpenses } from "@/server/queries";

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

  const { groups } = await getExpenses({ month });
  const header = ["التاريخ", "التصنيف", "المبلغ", "العملة", "طريقة الدفع", "ملاحظة"];
  const lines = [header.map(csvCell).join(",")];

  for (const group of groups) {
    for (const e of group.items) {
      lines.push(
        [
          e.date,
          e.categoryName ?? "غير مصنّف",
          fromMinor(e.amount),
          user.currency,
          PAYMENT_METHOD_LABELS[e.paymentMethod],
          e.note ?? "",
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }

  // BOM so Excel opens UTF-8 Arabic text correctly.
  const body = "﻿" + lines.join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
