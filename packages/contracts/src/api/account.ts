import { z } from "zod";

import { budgetAmount, currencyCode, requiredText } from "./common";

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Every field is optional: only what is sent changes. */
export const updateProfile = z
  .object({
    name: requiredText(50, "أدخل الاسم"),
    currency: currencyCode,
    monthlyBudget: budgetAmount,
    timezone: z.string().max(64).refine(isTimeZone, "منطقة زمنية غير صالحة"),
    notifyBudget: z.boolean(),
    notifyDailyReminder: z.boolean(),
    notifyMonthlySummary: z.boolean(),
    notifyRecurring: z.boolean(),
    notifyDebts: z.boolean(),
  })
  .partial();

export type UpdateProfile = z.infer<typeof updateProfile>;
