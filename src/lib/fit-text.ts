/** Bidi control characters that take no visual space (LRI/PDI/RLM…). */
const INVISIBLE = /[‎‏⁦-⁩]/g;

/** Same idea for the narrow three-column boxes (≈100px wide on a phone). */
export function compactValueSize(value: string): string {
  const length = value.replace(INVISIBLE, "").length;
  if (length <= 9) return "text-[15px]";
  if (length <= 11) return "text-[13px]";
  return "text-[12px]";
}

/**
 * Pick a font size for a stat value so it fits a half-width card on a phone
 * instead of being cut off ("1,404.59 U…"). Long values (big amounts, long
 * currency symbols like "ر.س.") step down; `truncate` stays as a last resort.
 */
export function statValueSize(value: string): string {
  const length = value.replace(INVISIBLE, "").length;
  if (length <= 9) return "text-[21px]";
  if (length <= 11) return "text-[18px]";
  if (length <= 13) return "text-[16px]";
  return "text-[14px]";
}
