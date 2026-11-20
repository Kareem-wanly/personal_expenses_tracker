import { formatNumber } from "@/lib/money";

/**
 * Arabic count agreement for "expense":
 * 1 → مصروف واحد · 2 → مصروفين · 3–10 → ٣ مصاريف · 11+ → ١١ مصروفاً
 */
export function countExpenses(n: number): string {
  if (n === 1) return "مصروف واحد";
  if (n === 2) return "مصروفين";
  if (n % 100 >= 3 && n % 100 <= 10) return `${formatNumber(n)} مصاريف`;
  return `${formatNumber(n)} مصروفاً`;
}
