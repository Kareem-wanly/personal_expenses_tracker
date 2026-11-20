import { cn } from "@/lib/utils";

/**
 * iOS-style large title. The compact title in <NavBar> takes over once
 * this scrolls out of view.
 */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  /** Small caption above the title (e.g. today's date). */
  eyebrow?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-end justify-between gap-3 pb-3 pt-10", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 text-[13px] font-semibold text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="truncate text-[32px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 pb-1">{action}</div>}
    </header>
  );
}
