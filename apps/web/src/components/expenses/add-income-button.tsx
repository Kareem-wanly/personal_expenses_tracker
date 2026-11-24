"use client";

import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { openIncomeForm } from "./expense-form-store";

/** Quiet text-style action (outlined), so the page keeps one strong button. */
export function AddIncomeButton({ label = "إضافة دخل", className }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openIncomeForm()}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1 rounded-[10px] px-3 text-[14px] font-semibold text-foreground ring-1 ring-inset ring-hairline transition-colors active:bg-foreground/[0.06]",
        className,
      )}
    >
      <PlusIcon className="size-4" strokeWidth={2.2} />
      {label}
    </button>
  );
}
