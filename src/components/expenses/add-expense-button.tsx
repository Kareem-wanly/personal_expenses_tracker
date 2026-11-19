"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { openExpenseForm } from "./expense-form-store";

export function AddExpenseButton({
  label = "إضافة مصروف",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Button className={className} onClick={() => openExpenseForm()}>
      <PlusIcon />
      {label}
    </Button>
  );
}
