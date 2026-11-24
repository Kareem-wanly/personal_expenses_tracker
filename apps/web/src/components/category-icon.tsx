import { cn } from "@/lib/utils";

/**
 * The user's chosen emoji on a neutral tile. The category colour appears as
 * a small dot (and in charts) instead of tinting the whole tile pastel.
 */
export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string | null;
  color: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.045] text-lg ring-1 ring-inset ring-hairline",
        className,
      )}
    >
      {icon ?? "·"}
      <span
        className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full ring-2 ring-card"
        style={{ backgroundColor: color ?? "var(--muted-foreground)" }}
      />
    </span>
  );
}
