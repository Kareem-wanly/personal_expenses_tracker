import { cn } from "@/lib/utils";

/**
 * Ledger primitives: the app's visual signature. Numbers are set in the
 * display face, labels and values are joined by a dotted leader, and the
 * budget meter is a ruled bar with ticks — no gradients, rings or glows.
 */

export type LedgerTone = "default" | "positive" | "negative" | "warning" | "muted";

const toneText: Record<LedgerTone, string> = {
  default: "text-foreground",
  positive: "text-positive",
  negative: "text-negative",
  warning: "text-warning",
  muted: "text-muted-foreground",
};

export function LedgerRows({
  rows,
  className,
}: {
  rows: { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode; tone?: LedgerTone }[];
  className?: string;
}) {
  return (
    <dl className={cn("space-y-3", className)}>
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-baseline gap-2">
            <dt className="shrink-0 text-[15px] text-muted-foreground">{r.label}</dt>
            <span aria-hidden className="leader" />
            <dd className={cn("shrink-0 font-display text-[17px] font-semibold tabular", toneText[r.tone ?? "default"])}>
              {r.value}
            </dd>
          </div>
          {r.hint && <p className="mt-0.5 text-end text-[12px] text-muted-foreground">{r.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

/**
 * Budget meter: ink fill on a hairline track with quarter ticks. When `pace`
 * is given (share of the month elapsed), a notch marks where spending
 * "should" be today — ahead of it means spending faster than planned.
 */
export function LedgerMeter({
  ratio,
  pace,
  label,
}: {
  ratio: number;
  pace?: number;
  label: string;
}) {
  const fill = Math.min(ratio, 1);
  const tone = ratio > 1 ? "bg-negative" : ratio >= 0.8 ? "bg-warning" : "bg-ink";
  return (
    <div
      className="relative h-3"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fill * 100)}
    >
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-hairline" />
      <div
        className={cn("absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-700", tone)}
        style={{ insetInlineStart: 0, width: `${fill * 100}%` }}
      />
      {[0.25, 0.5, 0.75].map((t) => (
        <span
          key={t}
          aria-hidden
          className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-muted-foreground/40"
          style={{ insetInlineStart: `${t * 100}%` }}
        />
      ))}
      {pace !== undefined && pace > 0 && pace < 1 && (
        <span
          aria-hidden
          title="المعدّل المتوقّع حتى اليوم"
          className="absolute top-0 h-full w-[2px] -translate-x-1/2 rounded-full bg-primary"
          style={{ insetInlineStart: `${pace * 100}%` }}
        />
      )}
    </div>
  );
}
