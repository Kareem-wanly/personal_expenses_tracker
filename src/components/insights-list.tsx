import type { Insight, InsightTone } from "@/lib/insights";
import { cn } from "@/lib/utils";

/** A thin rule on the start edge says whether a note is good, a warning, … */
const TONE: Record<InsightTone, string> = {
  good: "bg-positive",
  warn: "bg-warning",
  bad: "bg-negative",
  info: "bg-muted-foreground/40",
};

const TONE_LABEL: Record<InsightTone, string> = {
  good: "إيجابي",
  warn: "تنبيه",
  bad: "تحذير",
  info: "ملاحظة",
};

/**
 * Rule-based notes on the month (see lib/insights). Numbered and set as
 * text — the content is the point, not decoration.
 */
export function InsightsList({
  insights,
  limit,
  title = "ملاحظات الشهر",
}: {
  insights: Insight[];
  limit?: number;
  title?: string;
}) {
  const shown = limit ? insights.slice(0, limit) : insights;
  if (!shown.length) return null;

  return (
    <section className="space-y-2.5" aria-label={title}>
      <h2 className="px-1 text-[18px] font-semibold">{title}</h2>
      <ol className="surface divide-y divide-hairline overflow-hidden">
        {shown.map((i, n) => (
          <li key={i.id} className="relative flex gap-3 py-3.5 pe-4 ps-5">
            <span aria-hidden className={cn("absolute inset-y-3.5 start-0 w-[3px] rounded-e-full", TONE[i.tone])} />
            <span className="sr-only">{TONE_LABEL[i.tone]}: </span>
            <span aria-hidden className="mt-0.5 w-5 shrink-0 font-display text-[13px] font-semibold text-muted-foreground tabular">
              {String(n + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-snug">{i.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{i.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
