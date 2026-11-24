import { z } from "zod";

import { CURRENCIES } from "@masrufi/core/constants";
import { DATE_RE, MONTH_RE } from "@masrufi/core/dates";
import { FREQUENCIES } from "@masrufi/core/enums";

/** Building blocks of every request body. Amounts are integers in minor units (cents). */

const MAX_AMOUNT = 100_000_000_000;

export const positiveAmount = z
  .int("مبلغ غير صالح")
  .positive("المبلغ يجب أن يكون أكبر من صفر")
  .max(MAX_AMOUNT, "المبلغ كبير جداً");

export const budgetAmount = z.int().min(0).max(MAX_AMOUNT).nullable();

/** Created on the device; sending the same id twice never duplicates a row. */
export const clientId = z.uuid().optional();

export const currencyCode = z.enum(
  CURRENCIES.map((c) => c.code) as [string, ...string[]],
  "عملة غير مدعومة",
);

/** A real calendar day: rejects 2026-02-31. */
export const isoDate = z
  .string()
  .regex(DATE_RE, "تاريخ غير صالح")
  .refine((v) => new Date(`${v}T00:00:00Z`).toISOString().startsWith(v), "تاريخ غير صالح");

export const isoMonth = z.string().regex(MONTH_RE, "شهر غير صالح");

export const note = z
  .string()
  .trim()
  .max(120, "الحد الأقصى 120 حرف")
  .nullish()
  .transform((v) => v || null);

export const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max, `الحد الأقصى ${max} حرف`);

export const icon = z.string().min(1).max(8);

export const repeat = z.enum(["none", ...FREQUENCIES]).default("none");

/** Entry in another currency: `rate` = units of the user's currency per one unit. */
export const foreignMoney = {
  currency: currencyCode.optional(),
  rate: z.number("سعر صرف غير صالح").positive("سعر صرف غير صالح").max(10_000_000).optional(),
};
