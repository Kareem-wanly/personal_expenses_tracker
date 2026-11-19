"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "@/lib/constants";
import { fromMinor } from "@/lib/money";
import type { ActionState } from "@/lib/validations";
import { saveSettings } from "@/server/actions";

export function SettingsForm({
  name,
  currency,
  monthlyBudget,
}: {
  name: string;
  currency: string;
  monthlyBudget: number | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveSettings,
    { ok: false },
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم</Label>
        <Input id="name" name="name" defaultValue={name} required maxLength={50} className="h-11" />
        {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">العملة</Label>
        <select
          id="currency"
          name="currency"
          defaultValue={currency}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthlyBudget">الميزانية الشهرية</Label>
        <Input
          id="monthlyBudget"
          name="monthlyBudget"
          inputMode="decimal"
          dir="ltr"
          placeholder="اتركه فارغاً لإلغاء الميزانية"
          defaultValue={monthlyBudget != null ? String(fromMinor(monthlyBudget)) : ""}
          className="h-11 text-start"
        />
        {errors.monthlyBudget && (
          <p className="text-sm text-destructive">{errors.monthlyBudget[0]}</p>
        )}
        <p className="text-xs text-muted-foreground">
          سننبّهك بصرياً عند اقترابك من تجاوزها.
        </p>
      </div>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        حفظ
      </Button>
    </form>
  );
}
