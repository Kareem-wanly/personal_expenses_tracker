import { z } from "zod";

import { FREQUENCIES, INCOME_SOURCES, PAYMENT_METHODS } from "@/db/schema";
import { CURRENCIES } from "@/lib/constants";
import { DATE_RE } from "@/lib/dates";

/** Accepts "12.5", "12,5" and Arabic-Indic digits ("١٢٫٥"). */
export function normalizeAmountInput(raw: string): string {
  return raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, ".")
    .replace(/[^\d.]/g, "");
}

const amount = z
  .string({ error: "أدخل المبلغ" })
  .transform(normalizeAmountInput)
  .pipe(
    z.coerce
      .number<string>({ error: "مبلغ غير صالح" })
      .positive("المبلغ يجب أن يكون أكبر من صفر")
      .max(1_000_000_000, "المبلغ كبير جداً"),
  );

/** Optional money field: "" → null, otherwise a non-negative number. */
const optionalAmount = z
  .string()
  .optional()
  .transform((v) => (v ? normalizeAmountInput(v) : ""))
  .pipe(
    z.union([
      z.literal("").transform(() => null),
      z.coerce.number<string>().min(0).max(1_000_000_000),
    ]),
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `الحد الأقصى ${max} حرف`)
    .optional()
    .transform((v) => (v ? v : null));

export const expenseSchema = z.object({
  id: z.string().optional(),
  amount,
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  date: z.string().regex(DATE_RE, "تاريخ غير صالح"),
  note: optionalText(120),
  paymentMethod: z.enum(PAYMENT_METHODS).default("cash"),
  /** New expenses only: also create a recurring rule from this one. */
  repeat: z.enum(["none", ...FREQUENCIES]).default("none"),
});

export const incomeSchema = z.object({
  id: z.string().optional(),
  amount,
  source: z.enum(INCOME_SOURCES).default("salary"),
  date: z.string().regex(DATE_RE, "تاريخ غير صالح"),
  note: optionalText(120),
  /** New income only: also create a recurring rule (e.g. monthly salary). */
  repeat: z.enum(["none", ...FREQUENCIES]).default("none"),
});

export const recurringSchema = z.object({
  id: z.string().min(1),
  amount,
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  note: optionalText(120),
  paymentMethod: z.enum(PAYMENT_METHODS).default("cash"),
  frequency: z.enum(FREQUENCIES),
  nextDate: z.string().regex(DATE_RE, "تاريخ غير صالح"),
  /** Income rules only. */
  source: z.enum(INCOME_SOURCES).optional(),
});

/** Several expenses parsed from one sentence ("قهوة 5 وسندويشة 7"). */
export const quickAddSchema = z
  .array(
    z.object({
      amount: z.number().positive().max(1_000_000_000),
      categoryId: z.string().nullable(),
      date: z.string().regex(DATE_RE),
      note: z.string().trim().max(120).nullable(),
      paymentMethod: z.enum(PAYMENT_METHODS),
    }),
  )
  .min(1)
  .max(20);

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "أدخل اسم التصنيف").max(30, "الاسم طويل جداً"),
  icon: z.string().min(1).max(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح"),
  budget: optionalAmount,
});

const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "أدخل الاسم").max(50),
  currency: z.enum(currencyCodes),
  monthlyBudget: optionalAmount,
});

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = { ok: false };

export function fromZodError(error: z.ZodError): ActionState {
  return {
    ok: false,
    message: "تحقّق من الحقول المدخلة",
    fieldErrors: z.flattenError(error).fieldErrors as ActionState["fieldErrors"],
  };
}
