/**
 * Text normalisation for matching spoken/typed Arabic. Only used for
 * matching: anything shown to the user keeps its original spelling.
 */

const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

export function normalizeArabic(input: string): string {
  return (
    input
      .replace(DIACRITICS, "")
      .replace(TATWEEL, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      // Arabic-Indic and Persian digits → ASCII.
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      // Arabic decimal separator, and thousands separators between digits.
      .replace(/(\d)[٫](\d)/g, "$1.$2")
      .replace(/(\d)[,٬](?=\d{3}\b)/g, "$1")
      .toLowerCase()
  );
}

export type Token = {
  /** Normalised form, for matching. */
  norm: string;
  /** Original spelling, for display (e.g. the note). */
  raw: string;
};

/**
 * Split into tokens. Numbers glued to words ("ب20", "20$", "٥دولار") are
 * separated; punctuation becomes a boundary.
 */
export function tokenize(input: string): Token[] {
  const spaced = input
    // "1,500" / "١٬٥٠٠" → one number before punctuation becomes a boundary.
    .replace(/([0-9٠-٩])[,٬](?=[0-9٠-٩]{3}(?![0-9٠-٩]))/g, "$1")
    .replace(/[،؛؟?!.,:;()"'«»\-–—/\\]+(?!\d)/g, " ")
    .replace(/([0-9٠-٩][0-9٠-٩.٫]*)/g, " $1 ")
    .replace(/\$/g, " $ ");
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({ raw, norm: normalizeArabic(raw) }))
    .filter((t) => t.norm.length > 0);
}

const LEADING = ["وبال", "وال", "بال", "عال", "فال", "كال", "هال", "لل", "ال"];

/**
 * Candidate base forms of a token with clitics removed:
 * "وبالبطاقه" → ["وبالبطاقه", "بالبطاقه", "بطاقه", …].
 */
export function stems(norm: string): string[] {
  const out = new Set<string>([norm]);
  for (const p of LEADING) {
    if (norm.startsWith(p) && norm.length - p.length >= 2) out.add(norm.slice(p.length));
  }
  // Single-letter clitics are ambiguous ("عبيت" is not "ع + بيت"), so only
  // the very common "و" (and) / "ب" (for/with) are peeled, and only when a
  // real word is left.
  for (const s of [...out]) {
    for (const p of ["و", "ب"]) {
      if (s.startsWith(p) && s.length - p.length >= 3) {
        const rest = s.slice(p.length);
        out.add(rest);
        if (rest.startsWith("ال") && rest.length > 3) out.add(rest.slice(2));
      }
    }
  }
  return [...out];
}

/** Display form of a single word without leading clitics ("بالسوبرماركت" → "سوبرماركت"). */
export function bareWord(raw: string): string {
  const n = normalizeArabic(raw);
  // Single letters (و/ب) are ambiguous ("بنزين", "ورق"), so only strip
  // them when an article follows.
  for (const p of ["وبال", "وال", "بال", "عال", "فال", "لل", "ال"]) {
    if (n.startsWith(p) && n.length - p.length >= 2) {
      // Clitics are single-code-unit letters, so lengths line up with `raw`
      // except for removed diacritics; strip by counting base letters.
      let count = p.length;
      let i = 0;
      while (count > 0 && i < raw.length) {
        if (!/[ً-ٰٟـ]/.test(raw[i])) count--;
        i++;
      }
      return raw.slice(i);
    }
  }
  return raw;
}
