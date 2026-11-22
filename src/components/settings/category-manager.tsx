"use client";

import { CheckIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useEffectEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/category-icon";
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
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Group, RowButton } from "@/components/ui/grouped-list";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import { formatMoney, formatNumber, fromMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validations";
import { deleteCategory, saveCategory } from "@/server/actions";

type Item = {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** Monthly budget in minor units, if set. */
  budget: number | null;
  expenseCount: number;
};

const SPRING = { type: "spring", stiffness: 520, damping: 30 } as const;

export function CategoryManager({
  categories,
  currency,
}: {
  categories: Item[];
  currency: string;
}) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function openForm(item: Item | null) {
    setEditing(item);
    setFormKey((k) => k + 1);
    setOpen(true);
  }

  return (
    <>
      <Group header="التصنيفات" footer="حذف التصنيف لا يحذف مصاريفه؛ تصبح «غير مصنّفة».">
        {categories.map((c) => (
          <RowButton
            key={c.id}
            onClick={() => openForm(c)}
            leading={<CategoryIcon icon={c.icon} color={c.color} className="size-[30px] rounded-[8px] text-[16px]" />}
            title={c.name}
            subtitle={c.budget != null ? `ميزانية ${formatMoney(c.budget, currency)} شهرياً` : undefined}
            trailing={
              <span className="text-[15px] text-muted-foreground tabular">
                {formatNumber(c.expenseCount)}
              </span>
            }
            chevron
          />
        ))}
        <RowButton
          onClick={() => openForm(null)}
          className="text-primary"
          leading={
            <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-primary/12 text-primary">
              <PlusIcon className="size-[18px]" strokeWidth={2.4} />
            </span>
          }
          title="إضافة تصنيف"
        />
      </Group>

      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerContent className="mx-auto max-w-2xl border-t-0 bg-background data-[swipe-direction=down]:rounded-t-[22px]">
          <CategoryForm
            key={formKey}
            item={editing}
            currency={currency}
            onDone={() => setOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}

function CategoryForm({
  item,
  currency,
  onDone,
}: {
  item: Item | null;
  currency: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCategory, {
    ok: false,
  });
  const [icon, setIcon] = useState(item?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState(item?.color ?? CATEGORY_COLORS[0]);
  const [name, setName] = useState(item?.name ?? "");

  // React to each new action result once (onDone is a fresh closure per render).
  const onResult = useEffectEvent((result: ActionState) => {
    if (result.ok) {
      navigator.vibrate?.(10);
      toast.success(result.message);
      onDone();
    } else if (result.message && !result.fieldErrors) {
      toast.error(result.message);
    }
  });
  useEffect(() => onResult(state), [state]);

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <div className="relative flex h-11 shrink-0 items-center justify-between px-4">
        <button type="button" onClick={onDone} className="text-[17px] text-primary active:opacity-50">
          إلغاء
        </button>
        <DrawerTitle className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold">
          {item ? "تعديل التصنيف" : "تصنيف جديد"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">اختر اسماً وأيقونة ولوناً للتصنيف</DrawerDescription>
        {item ? <DeleteCategory item={item} onDeleted={onDone} /> : <span className="w-8" />}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Live preview */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <motion.span
            key={`${icon}-${color}`}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={SPRING}
            className="relative flex size-20 items-center justify-center rounded-[18px] bg-foreground/[0.045] text-[40px] shadow-[inset_0_0_0_1px_var(--hairline)]"
          >
            {icon}
            <span
              aria-hidden
              className="absolute -bottom-1 -end-1 size-4 rounded-full ring-[3px] ring-background"
              style={{ backgroundColor: color }}
            />
          </motion.span>
          <span className="text-[13px] text-muted-foreground">{name || "اسم التصنيف"}</span>
        </div>

        <div className="surface px-4">
          <label htmlFor="cat-name" className="sr-only">
            الاسم
          </label>
          <input
            id="cat-name"
            name="name"
            required
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم التصنيف"
            aria-invalid={!!state.fieldErrors?.name}
            className="h-12 w-full bg-transparent text-center text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />
        </div>
        <AnimatePresence>
          {state.fieldErrors?.name && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="-mt-3 text-center text-[13px] text-destructive"
            >
              {state.fieldErrors.name[0]}
            </motion.p>
          )}
        </AnimatePresence>

        <div>
          <label
            htmlFor="cat-budget"
            className="mb-2 block px-1 text-[13px] font-medium text-muted-foreground"
          >
            ميزانية شهرية (اختياري)
          </label>
          <div className="surface flex items-center gap-2 px-4">
            <input
              id="cat-budget"
              name="budget"
              inputMode="decimal"
              dir="ltr"
              autoComplete="off"
              placeholder="بدون"
              defaultValue={item?.budget != null ? String(fromMinor(item.budget)) : ""}
              aria-invalid={!!state.fieldErrors?.budget}
              className="h-12 min-w-0 flex-1 bg-transparent text-[17px] tabular outline-none placeholder:text-muted-foreground"
            />
            <span className="text-[13px] font-semibold text-muted-foreground">{currency}</span>
          </div>
          <p className="mt-1.5 px-1 text-[13px] text-muted-foreground">
            {state.fieldErrors?.budget
              ? "أدخل مبلغاً صحيحاً أو اتركه فارغاً"
              : "نعرض تقدّمك عليها، وننبّهك عند 80% منها وعند تجاوزها."}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">اللون</legend>
          <div className="surface grid grid-cols-6 place-items-center gap-y-3 p-4">
            {CATEGORY_COLORS.map((c) => {
              const selected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`اللون ${c}`}
                  aria-pressed={selected}
                  className="relative flex size-9 items-center justify-center rounded-full transition-transform active:scale-90"
                  style={{ backgroundColor: c }}
                >
                  {selected && (
                    <motion.span
                      layoutId="color-ring"
                      transition={SPRING}
                      className="absolute -inset-[5px] rounded-full border-[2.5px]"
                      style={{ borderColor: c }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">الأيقونة</legend>
          <div className="surface grid grid-cols-6 gap-1.5 p-3">
            {CATEGORY_ICONS.map((i) => {
              const selected = icon === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  aria-pressed={selected}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-[12px] text-[24px] transition-transform active:scale-90",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="icon-tile"
                      transition={SPRING}
                      className="absolute inset-0 rounded-[12px]"
                      style={{ backgroundColor: `${color}2e` }}
                    />
                  )}
                  <span className="relative">{i}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="tint-button flex h-[52px] w-full items-center justify-center gap-2 text-[17px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
        >
          {pending ? <Loader2Icon className="size-5 animate-spin" /> : <CheckIcon className="size-5" strokeWidth={2.6} />}
          {item ? "حفظ التعديلات" : "إضافة التصنيف"}
        </motion.button>
      </div>
    </form>
  );
}

function DeleteCategory({ item, onDeleted }: { item: Item; onDeleted: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            aria-label={`حذف ${item.name}`}
            disabled={pending}
            className="flex size-8 items-center justify-center rounded-full text-destructive active:opacity-50"
          />
        }
      >
        {pending ? <Loader2Icon className="size-5 animate-spin" /> : <Trash2Icon className="size-5" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف «{item.name}»؟</AlertDialogTitle>
          <AlertDialogDescription>
            {item.expenseCount > 0
              ? `لن تُحذف مصاريفه (${item.expenseCount})، بل ستصبح «غير مصنّفة».`
              : "لا توجد مصاريف مرتبطة بهذا التصنيف."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await deleteCategory(item.id);
                navigator.vibrate?.(10);
                toast.success(res.message);
                onDeleted();
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
