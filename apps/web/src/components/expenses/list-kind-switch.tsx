"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";

export type ListKind = "expense" | "income";

/** "مصاريف | دخل" on the transactions tab; keeps the selected month. */
export function ListKindSwitch({ value, month }: { value: ListKind; month?: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <SegmentedControl
      label="نوع العمليات"
      value={value}
      className="mx-auto w-full max-w-xs"
      onChange={(kind) => {
        const sp = new URLSearchParams();
        if (kind === "income") sp.set("type", "income");
        if (month) sp.set("month", month);
        const qs = sp.toString();
        startTransition(() => router.replace(`/expenses${qs ? `?${qs}` : ""}`, { scroll: false }));
      }}
      options={[
        { value: "expense", label: "المصاريف" },
        { value: "income", label: "الدخل" },
      ]}
    />
  );
}
