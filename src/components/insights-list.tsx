import { SparklesIcon } from "lucide-react";

import type { Insight, InsightTone } from "@/lib/insights";
import { cn } from "@/lib/utils";

const TONE: Record<InsightTone, string> = {
  good: "bg-[#34c759]/12",
  warn: "bg-[#ff9f0a]/14",
  bad: "bg-[#ff3b30]/12",
  info: "bg-[#0a84ff]/10",
};

/** Rule-based insights (see lib/insights): no AI, computed from your data. */
export function InsightsList({
  insights,
  limit,
  title = "رؤى ذكية",
}: {
  insights: Insight[];
  limit?: number;
  title?: string;
}) {
  const shown = limit ? insights.slice(0, limit) : insights;
  if (!shown.length) return null;

  return (
    <section className="space-y-2.5" aria-label={title}>
      <h2 className="flex items-center gap-1.5 px-1 text-[20px] font-bold">
        <SparklesIcon className="size-5 text-primary" />
        {title}
      </h2>
      <ul className="space-y-2">
        {shown.map((i) => (
          <li key={i.id} className="surface flex gap-3 p-3.5">
            <span
              aria-hidden
              className={cn("flex size-10 shrink-0 items-center justify-center rounded-[12px] text-[20px]", TONE[i.tone])}
            >
              {i.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-snug">{i.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{i.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
