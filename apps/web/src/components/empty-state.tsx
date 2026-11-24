/**
 * Empty state: a short headline and one line of guidance, set as text on a
 * ruled card. (`icon` is accepted for call-site compatibility; empty states
 * deliberately don't show a big emoji.)
 */
export function EmptyState({
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
    <div className="surface flex flex-col items-start gap-1.5 px-5 py-6">
      <p className="font-display text-[18px] font-semibold">{title}</p>
      {description && <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
