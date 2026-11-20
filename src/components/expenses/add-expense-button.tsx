"use client";

import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { openExpenseForm } from "./expense-form-store";

export function AddExpenseButton({
  label = "إضافة مصروف",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openExpenseForm()}
      className={cn(
        "tint-button mt-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-6 text-[15px] font-semibold transition-transform active:scale-95",
        className,
      )}
    >
      <PlusIcon className="size-[18px]" strokeWidth={2.6} />
      {label}
    </button>
  );
}
