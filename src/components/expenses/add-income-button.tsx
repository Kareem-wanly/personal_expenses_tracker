"use client";

import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { openIncomeForm } from "./expense-form-store";

export function AddIncomeButton({ label = "إضافة دخل", className }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openIncomeForm()}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#34c759]/15 px-4 text-[14px] font-semibold text-[#248a3d] transition-transform active:scale-95 dark:text-[#30d158]",
        className,
      )}
    >
      <PlusIcon className="size-4" strokeWidth={2.6} />
      {label}
    </button>
  );
}
