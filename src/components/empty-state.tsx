export function EmptyState({
  icon = "🧾",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span
        className="mb-1 flex size-16 items-center justify-center rounded-[20px] bg-foreground/[0.05] text-4xl dark:bg-white/[0.08]"
        aria-hidden
      >
        {icon}
      </span>
      <p className="text-[17px] font-semibold">{title}</p>
      {description && (
        <p className="max-w-xs text-[15px] text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}
