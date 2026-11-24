"use client";

import { ChevronsUpDownIcon, CoinsIcon, Loader2Icon, PiggyBankIcon, UserIcon } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Group, Row, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { CURRENCIES } from "@masrufi/core/constants";
import { fromMinor } from "@masrufi/core/money";
import type { ActionState } from "@masrufi/contracts/validations";
import { saveSettings } from "@/server/actions";

const field =
  "h-9 w-full min-w-0 bg-transparent text-[16px] text-muted-foreground outline-none placeholder:text-muted-foreground/60 focus:text-foreground";

export function SettingsForm({
  name,
  currency,
  monthlyBudget,
}: {
  name: string;
  currency: string;
  monthlyBudget: number | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, {
    ok: false,
  });
  const initial = {
    name,
    currency,
    budget: monthlyBudget != null ? String(fromMinor(monthlyBudget)) : "",
  };
  const [values, setValues] = useState(initial);

  // After a save, the server sends the stored values back as props: adopt
  // them, so what's on screen is always what's saved.
  const saved = `${initial.name}|${initial.currency}|${initial.budget}`;
  const [lastSaved, setLastSaved] = useState(saved);
  if (saved !== lastSaved) {
    setLastSaved(saved);
    setValues(initial);
  }

  const dirty =
    values.name !== initial.name ||
    values.currency !== initial.currency ||
    values.budget !== initial.budget;

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  const errors = state.fieldErrors ?? {};
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    // Submitted via onSubmit, not <form action>: React resets a form after
    // an action, and a controlled <select> would then snap back to the
    // option it first rendered with (the old currency) until a reload.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Group
        header="الحساب"
        footer={
          errors.name?.[0] ?? errors.monthlyBudget?.[0] ?? "اترك الميزانية فارغة لإلغائها. سننبّهك عند 80% منها."
        }
      >
        <Row
          leading={<RowIcon icon={UserIcon} />}
          title={<label htmlFor="name">الاسم</label>}
          trailing={
            <input
              id="name"
              name="name"
              required
              maxLength={50}
              value={values.name}
              onChange={set("name")}
              className={`${field} max-w-[55%] text-end`}
            />
          }
        />
        <Row
          leading={<RowIcon icon={CoinsIcon} />}
          title={<label htmlFor="currency">العملة</label>}
          trailing={
            <span className="relative flex items-center gap-1 text-muted-foreground">
              <select
                id="currency"
                name="currency"
                value={values.currency}
                onChange={set("currency")}
                className="h-9 appearance-none bg-transparent pe-5 text-end text-[16px] outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} ({c.code})
                  </option>
                ))}
              </select>
              <ChevronsUpDownIcon className="pointer-events-none absolute end-0 size-4 opacity-60" />
            </span>
          }
        />
        <Row
          leading={<RowIcon icon={PiggyBankIcon} />}
          title={<label htmlFor="monthlyBudget">الميزانية الشهرية</label>}
          trailing={
            <input
              id="monthlyBudget"
              name="monthlyBudget"
              inputMode="decimal"
              dir="ltr"
              placeholder="بدون"
              value={values.budget}
              onChange={set("budget")}
              aria-invalid={!!errors.monthlyBudget}
              className={`${field} max-w-[40%] text-left tabular`}
            />
          }
        />
      </Group>

      {/* Appears only when something changed, like an iOS "Done" button. */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          dirty || pending ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!dirty && !pending}
      >
        <div className="overflow-hidden pt-4">
          <Group>
            <RowButton
              type="submit"
              disabled={pending || !dirty}
              center
              className="font-semibold text-primary"
              title={
                <span className="flex items-center gap-2">
                  {pending && <Loader2Icon className="size-4 animate-spin" />}
                  حفظ التغييرات
                </span>
              }
            />
          </Group>
        </div>
      </div>
    </form>
  );
}
