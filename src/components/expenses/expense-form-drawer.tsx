"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { addDays, toISODate } from "@/lib/dates";
import { fromMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validations";
import { deleteExpense, saveExpense } from "@/server/actions";
import type { CategoryOption } from "@/server/queries";

import {
  closeExpenseForm,
  openExpenseForm,
  useExpenseFormState,
} from "./expense-form-store";

type Props = { categories: CategoryOption[]; currency: string };

export function ExpenseFormDrawer({ categories, currency }: Props) {
  const { open, expense, nonce } = useExpenseFormState();
  const searchParams = useSearchParams();
  const router = useRouter();

  // PWA shortcut: /?add=1 opens the form directly.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      openExpenseForm();
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? undefined : closeExpenseForm())}
      showSwipeHandle
    >
      <DrawerContent
        className="mx-auto max-w-2xl"
        // New expense: jump straight to the amount so the keypad opens.
        initialFocus={
          expense ? undefined : () => document.getElementById("amount")
        }
      >
        <DrawerHeader className="pb-0">
          <DrawerTitle>{expense ? "تعديل المصروف" : "مصروف جديد"}</DrawerTitle>
          <DrawerDescription className="sr-only">
            أدخل المبلغ واختر التصنيف ثم احفظ
          </DrawerDescription>
        </DrawerHeader>
        {/* Remount on every open so the form starts fresh. */}
        <ExpenseForm
          key={nonce}
          categories={categories}
          currency={currency}
          expense={expense}
        />
      </DrawerContent>
    </Drawer>
  );
}

function ExpenseForm({
  categories,
  currency,
  expense,
}: Props & { expense: ReturnType<typeof useExpenseFormState>["expense"] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveExpense,
    { ok: false },
  );
  const today = toISODate(new Date());
  const [date, setDate] = useState(expense?.date ?? today);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      closeExpenseForm();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const errors = state.fieldErrors ?? {};
  const defaultCategory = expense ? expense.categoryId : categories[0]?.id;

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-2">
        {expense && <input type="hidden" name="id" value={expense.id} />}

        {/* Amount */}
        <div className="flex flex-col items-center gap-1 py-2">
          <Label htmlFor="amount" className="sr-only">
            المبلغ
          </Label>
          <div className="flex items-baseline gap-2" dir="ltr">
            <input
              id="amount"
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              required
              placeholder="0"
              defaultValue={expense ? String(fromMinor(expense.amount)) : ""}
              aria-invalid={!!errors.amount}
              className="w-48 bg-transparent text-center text-5xl font-bold tabular outline-none placeholder:text-muted-foreground/40"
            />
            <span className="text-lg font-medium text-muted-foreground">
              {currency}
            </span>
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount[0]}</p>
          )}
        </div>

        {/* Category */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">التصنيف</legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {categories.map((c) => (
              <label
                key={c.id}
                className="group relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  type="radio"
                  name="categoryId"
                  value={c.id}
                  defaultChecked={defaultCategory === c.id}
                  className="sr-only"
                />
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                <span className="line-clamp-1 text-[11px] font-medium">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">التاريخ</Label>
          <div className="flex gap-2">
            {[
              { label: "اليوم", value: today },
              { label: "أمس", value: addDays(today, -1) },
            ].map((d) => (
              <Button
                key={d.label}
                type="button"
                variant={date === d.value ? "default" : "outline"}
                className="h-10 px-4"
                onClick={() => setDate(d.value)}
              >
                {d.label}
              </Button>
            ))}
            <Input
              id="date"
              name="date"
              type="date"
              required
              value={date}
              max={addDays(today, 365)}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 flex-1"
            />
          </div>
        </div>

        {/* Payment method */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">طريقة الدفع</legend>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <label
                key={value}
                className="cursor-pointer rounded-lg py-2 text-center text-sm font-medium text-muted-foreground transition-colors has-checked:bg-background has-checked:text-foreground has-checked:shadow-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={value}
                  defaultChecked={(expense?.paymentMethod ?? "cash") === value}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">ملاحظة (اختياري)</Label>
          <Input
            id="note"
            name="note"
            maxLength={120}
            defaultValue={expense?.note ?? ""}
            placeholder="مثال: غداء مع الأصدقاء"
            className="h-11"
          />
          {errors.note && <p className="text-sm text-destructive">{errors.note[0]}</p>}
        </div>
      </div>

      <div className="flex gap-2 border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {expense && <DeleteExpenseButton id={expense.id} />}
        <Button type="submit" className="h-12 flex-1 text-base" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          {expense ? "حفظ التعديلات" : "إضافة"}
        </Button>
      </div>
    </form>
  );
}

function DeleteExpenseButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            className={cn("h-12 w-12")}
            aria-label="حذف المصروف"
            disabled={pending}
          />
        }
      >
        {pending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف المصروف؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف هذا المصروف نهائياً ولا يمكن التراجع عن ذلك.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await deleteExpense(id);
                toast.success(res.message);
                closeExpenseForm();
              })
            }
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
