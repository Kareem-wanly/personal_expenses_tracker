"use client";

import type { LucideIcon } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";

import { type EntryKind, setEntryKind } from "./expense-form-store";

export const SPRING = { type: "spring", stiffness: 520, damping: 30 } as const;

/** Settings-style row: plain line icon, label, trailing control. */
export function SheetRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 ps-4">
      <span aria-hidden className="flex size-6 shrink-0 items-center justify-center text-foreground/70">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div className="list-row-body flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 py-1.5 pe-4">
        {label && <span className="text-[16px]">{label}</span>}
        {children}
      </div>
    </div>
  );
}

/** "مصروف | دخل" switch shown at the top of the sheet for new entries. */
export function EntryKindSwitch({ value }: { value: EntryKind }) {
  return (
    <div className="px-4 pb-1">
      <SegmentedControl
        label="نوع العملية"
        value={value}
        onChange={setEntryKind}
        className="mx-auto w-full max-w-xs"
        options={[
          { value: "expense", label: "مصروف" },
          { value: "income", label: "دخل" },
        ]}
      />
    </div>
  );
}
