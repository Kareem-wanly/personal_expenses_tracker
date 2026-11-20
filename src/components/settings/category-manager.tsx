"use client";

import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import type { ActionState } from "@/lib/validations";
import { deleteCategory, saveCategory } from "@/server/actions";

type Item = {
  id: string;
  name: string;
  icon: string;
  color: string;
  expenseCount: number;
};

export function CategoryManager({ categories }: { categories: Item[] }) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function openForm(item: Item | null) {
    setEditing(item);
    setFormKey((k) => k + 1);
    setOpen(true);
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-separator surface overflow-hidden">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-3 p-3">
            <CategoryIcon icon={c.icon} color={c.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.expenseCount} مصروف</p>
            </div>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={`تعديل ${c.name}`}
              onClick={() => openForm(c)}
            >
              <PencilIcon />
            </Button>
            <DeleteCategory item={c} />
          </li>
        ))}
      </ul>

      <Button variant="outline" className="h-11 w-full" onClick={() => openForm(null)}>
        <PlusIcon />
        إضافة تصنيف
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل التصنيف" : "تصنيف جديد"}</DialogTitle>
            <DialogDescription className="sr-only">
              اختر اسماً وأيقونة ولوناً للتصنيف
            </DialogDescription>
          </DialogHeader>
          <CategoryForm key={formKey} item={editing} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({ item, onDone }: { item: Item | null; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveCategory,
    { ok: false },
  );
  const [icon, setIcon] = useState(item?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState(item?.color ?? CATEGORY_COLORS[0]);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      onDone();
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} color={color} className="size-12 text-2xl" />
        <div className="flex-1 space-y-1">
          <Label htmlFor="cat-name">الاسم</Label>
          <Input
            id="cat-name"
            name="name"
            defaultValue={item?.name}
            required
            maxLength={30}
            className="h-11"
            aria-invalid={!!state.fieldErrors?.name}
          />
        </div>
      </div>
      {state.fieldErrors?.name && (
        <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">الأيقونة</legend>
        <div className="grid grid-cols-8 gap-1">
          {CATEGORY_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              aria-pressed={icon === i}
              className="flex aspect-square items-center justify-center rounded-lg text-xl transition-colors hover:bg-muted aria-pressed:bg-primary/15 aria-pressed:ring-2 aria-pressed:ring-primary"
            >
              {i}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">اللون</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className="size-8 rounded-full ring-offset-2 ring-offset-background transition-transform aria-pressed:scale-110 aria-pressed:ring-2 aria-pressed:ring-foreground"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        حفظ
      </Button>
    </form>
  );
}

function DeleteCategory({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-destructive hover:text-destructive"
            aria-label={`حذف ${item.name}`}
            disabled={pending}
          />
        }
      >
        {pending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
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
                toast.success(res.message);
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
