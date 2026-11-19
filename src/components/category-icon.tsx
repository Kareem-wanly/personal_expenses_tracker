import { cn } from "@/lib/utils";

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string | null;
  color: string | null;
  className?: string;
}) {
  const c = color ?? "#94a3b8";
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl text-lg",
        className,
      )}
      style={{ backgroundColor: `${c}22`, boxShadow: `inset 0 0 0 1px ${c}33` }}
    >
      {icon ?? "❔"}
    </span>
  );
}
