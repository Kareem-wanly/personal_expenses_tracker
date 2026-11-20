import {
  DUAL_SCALE_WORDS,
  HALF_WORDS,
  HUNDRED_WORDS,
  NUMBER_WORDS,
  QUARTER_WORDS,
  SCALE_WORDS,
} from "./lexicon";
import type { Token } from "./normalize";

type Part =
  | { kind: "digits"; value: number }
  | { kind: "word"; value: number }
  | { kind: "hundred" }
  | { kind: "scale"; value: number }
  | { kind: "dual"; value: number }
  | { kind: "half" }
  | { kind: "quarter" };

/** Forms a number token may take with a leading "و" (and) or "ب" (for). */
function bases(norm: string): string[] {
  const out = [norm];
  for (const p of ["و", "ب", "وب"]) {
    if (norm.startsWith(p) && norm.length > p.length) out.push(norm.slice(p.length));
  }
  return out;
}

export function classify(norm: string): Part | null {
  for (const b of bases(norm)) {
    if (/^\d+(\.\d+)?\.?$/.test(b)) return { kind: "digits", value: parseFloat(b) };
    if (b in NUMBER_WORDS) return { kind: "word", value: NUMBER_WORDS[b] };
    if (HUNDRED_WORDS.has(b)) return { kind: "hundred" };
    if (b in SCALE_WORDS) return { kind: "scale", value: SCALE_WORDS[b] };
    if (b in DUAL_SCALE_WORDS) return { kind: "dual", value: DUAL_SCALE_WORDS[b] };
    if (HALF_WORDS.has(b)) return { kind: "half" };
    if (QUARTER_WORDS.has(b)) return { kind: "quarter" };
  }
  return null;
}

export type NumberSpan = { start: number; end: number; value: number };

/**
 * Find amounts written in digits or Arabic words, e.g. "25", "2.5 مليون",
 * "خمسه وعشرين", "تلات ميه", "عشرين الف", "الف ونص" (1500).
 * `skip` marks tokens already used for something else (dates…).
 */
export function findNumbers(tokens: Token[], skip: Set<number> = new Set()): NumberSpan[] {
  const spans: NumberSpan[] = [];
  let i = 0;
  while (i < tokens.length) {
    const first = skip.has(i) ? null : classify(tokens[i].norm);
    // A fraction alone ("نص كيلو") is not an amount.
    if (!first || first.kind === "half" || first.kind === "quarter") {
      i++;
      continue;
    }

    let total = 0;
    let current = 0;
    let lastUnit = 1;
    let prev: Part | null = null;
    let j = i;
    while (j < tokens.length && !skip.has(j)) {
      let part = classify(tokens[j].norm);
      // A bare "و" joins two number words: "خمسه و عشرين".
      if (!part && tokens[j].norm === "و" && prev && j + 1 < tokens.length) {
        const next = classify(tokens[j + 1].norm);
        if (next && next.kind !== "digits") {
          j++;
          continue;
        }
      }
      if (!part) break;
      // Digits start a new amount unless they open this one ("20 5" = two).
      if (part.kind === "digits" && prev) break;
      // After digits, only multipliers/fractions belong to the same amount.
      if (prev?.kind === "digits" && (part.kind === "word" || part.kind === "dual")) break;

      switch (part.kind) {
        case "digits":
          current += part.value;
          lastUnit = 1;
          break;
        case "word":
          current += part.value;
          lastUnit = part.value >= 100 ? 100 : 1;
          break;
        case "hundred":
          current = current > 0 && current < 10 ? current * 100 : current + 100;
          lastUnit = 100;
          break;
        case "scale":
          total += (current || 1) * part.value;
          current = 0;
          lastUnit = part.value;
          break;
        case "dual":
          total += part.value;
          current = 0;
          lastUnit = part.value / 2;
          break;
        case "half":
        case "quarter": {
          const frac = part.kind === "half" ? 2 : 4;
          if (current > 0) current += lastUnit === 1 ? 1 / frac : lastUnit / frac;
          else total += lastUnit / frac;
          break;
        }
      }
      prev = part;
      j++;
      part = null;
    }

    const value = total + current;
    if (j > i && value > 0) spans.push({ start: i, end: j, value });
    i = Math.max(j, i + 1);
  }
  return spans;
}
