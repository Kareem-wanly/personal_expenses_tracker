import { z } from "zod";

import { DEBT_DIRECTIONS, FREQUENCIES, INCOME_SOURCES, PAYMENT_METHODS } from "@masrufi/core/enums";
import { CURRENCIES } from "@masrufi/core/constants";
import { DATE_RE } from "@masrufi/core/dates";
import { normalizeAmountInput } from "@masrufi/core/money";

export { normalizeAmountInput };

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

const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];
const currencyCode = z.enum(currencyCodes, { error: "عملة غير مدعومة" });

const isoDate = z.string().regex(DATE_RE, "تاريخ غير صالح");
/** Optional `YYYY-MM-DD`: "" → null. */
const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.union([z.null(), isoDate]));

/**
 * Entry typed in another currency: which one, and how many units of the
 * user's currency one unit is worth. Both absent = the user's currency.
 */
const foreignMoney = {
  currency: currencyCode.optional(),
  rate: z
    .string()
    .optional()
    .transform((v) => (v ? normalizeAmountInput(v) : ""))
    .pipe(
      z.union([
        z.literal("").transform(() => null),
        z.coerce.number<string>({ error: "سعر صرف غير صالح" }).positive("سعر صرف غير صالح").max(10_000_000),
      ]),
    ),
};

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
  ...foreignMoney,
});

export const incomeSchema = z.object({
  id: z.string().optional(),
  amount,
  source: z.enum(INCOME_SOURCES).default("salary"),
  date: z.string().regex(DATE_RE, "تاريخ غير صالح"),
  note: optionalText(120),
  /** New income only: also create a recurring rule (e.g. monthly salary). */
  repeat: z.enum(["none", ...FREQUENCIES]).default("none"),
  ...foreignMoney,
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

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "أدخل الاسم").max(50),
  currency: z.enum(currencyCodes),
  monthlyBudget: optionalAmount,
});

/* ----------------------------- Debts & goals ------------------------------ */

export const debtSchema = z.object({
  id: z.string().optional(),
  direction: z.enum(DEBT_DIRECTIONS),
  person: z.string().trim().min(1, "أدخل اسم الشخص").max(60, "الاسم طويل جداً"),
  amount,
  currency: currencyCode,
  date: isoDate,
  dueDate: optionalDate,
  note: optionalText(120),
});

export const debtPaymentSchema = z.object({
  debtId: z.string().min(1),
  amount,
  date: isoDate,
  note: optionalText(120),
});

export const goalSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "أدخل اسم الهدف").max(40, "الاسم طويل جداً"),
  icon: z.string().min(1).max(8),
  target: amount,
  currency: currencyCode,
  deadline: optionalDate,
  /** New goals only: what's already put aside. */
  initial: optionalAmount,
});

export const contributionSchema = z.object({
  goalId: z.string().min(1),
  kind: z.enum(["deposit", "withdraw"]),
  amount,
  date: isoDate,
  note: optionalText(120),
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
