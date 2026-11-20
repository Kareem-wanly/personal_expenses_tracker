import { ChevronLeftIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * iOS inset-grouped list section: small header above, footnote below,
 * rows on a rounded card with hairlines that start after the icon.
 */
export function Group({
  header,
  footer,
  children,
  className,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {header && (
        <h2 className="mb-1.5 px-4 text-[13px] font-medium text-muted-foreground">{header}</h2>
      )}
      <div className="surface inset-list overflow-hidden">{children}</div>
      {footer && <div className="mt-1.5 px-4 text-[13px] leading-relaxed text-muted-foreground">{footer}</div>}
    </section>
  );
}

/** Settings-style glyph tile. */
export function RowIcon({ icon: Icon, tint }: { icon: LucideIcon; tint: string }) {
  return (
    <span
      aria-hidden
      className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white"
      style={{ backgroundColor: tint }}
    >
      <Icon className="size-[18px]" strokeWidth={2.2} />
    </span>
  );
}

const rowBase = "flex w-full items-center gap-3 ps-4 text-start";
const pressable =
  "transition-colors duration-150 active:bg-foreground/[0.06] focus-visible:bg-foreground/[0.04] focus-visible:outline-none disabled:opacity-50";

type RowContent = {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  /** Centered action row (e.g. "Sign out"), coloured by `className`. */
  center?: boolean;
};

function Body({ leading, title, subtitle, trailing, chevron, center }: RowContent) {
  return (
    <>
      {leading}
      <span
        className={cn(
          "list-row-body flex min-h-11 min-w-0 flex-1 items-center gap-3 py-2.5 pe-4",
          center && "justify-center",
        )}
      >
        <span className={cn("min-w-0", !center && "flex-1")}>
          <span className="block truncate text-[16px]">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{subtitle}</span>
          )}
        </span>
        {trailing}
        {chevron && <ChevronLeftIcon className="size-5 shrink-0 text-muted-foreground/50" />}
      </span>
    </>
  );
}

/** Static row: label on the start side, any control on the end side. */
export function Row({ className, ...content }: RowContent & { className?: string }) {
  return (
    <div className={cn(rowBase, className)}>
      <Body {...content} />
    </div>
  );
}

/** Tappable row. */
export function RowButton({
  className,
  onClick,
  type = "button",
  disabled,
  ...content
}: RowContent & {
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(rowBase, pressable, className)}>
      <Body {...content} />
    </button>
  );
}
