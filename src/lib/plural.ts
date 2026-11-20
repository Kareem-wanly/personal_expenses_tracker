import { formatNumber } from "@/lib/money";

/** 1 → مرة واحدة · 2 → مرتين · 3–10 → ٥ مرات · 11+ → ١٢ مرة */
export function countTimes(n: number): string {
  if (n === 1) return "مرة واحدة";
  if (n === 2) return "مرتين";
  if (n % 100 >= 3 && n % 100 <= 10) return `${formatNumber(n)} مرات`;
  return `${formatNumber(n)} مرة`;
}

/**
 * Multiple in construct form, followed by what it multiplies:
 * "ضعف ما صرفته" (×2) · "٣ أضعاف ما صرفته" · "١٣ ضعف ما صرفته".
 */
export function timesBigger(ratio: number): string {
  const n = Math.round(ratio);
  if (n <= 2) return "ضعف";
  if (n <= 10) return `${formatNumber(n)} أضعاف`;
  return `${formatNumber(n)} ضعف`;
}

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
