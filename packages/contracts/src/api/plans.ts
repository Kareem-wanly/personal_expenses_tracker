import { z } from "zod";

import { DEBT_DIRECTIONS } from "@masrufi/core/enums";

import { clientId, currencyCode, icon, isoDate, note, positiveAmount, requiredText } from "./common";

const optionalDate = isoDate.nullish().transform((v) => v ?? null);

export const saveDebt = z.object({
  direction: z.enum(DEBT_DIRECTIONS),
  person: requiredText(60, "أدخل اسم الشخص"),
  amount: positiveAmount,
  currency: currencyCode,
  date: isoDate,
  dueDate: optionalDate,
  note,
});
export const createDebt = saveDebt.extend({ id: clientId });

export const createDebtPayment = z.object({
  id: clientId,
  amount: positiveAmount,
  date: isoDate,
  note,
});

export const saveGoal = z.object({
  name: requiredText(40, "أدخل اسم الهدف"),
  icon,
  target: positiveAmount,
  currency: currencyCode,
  deadline: optionalDate,
});
/** `initial`: what is already put aside. */
export const createGoal = saveGoal.extend({ id: clientId, initial: positiveAmount.nullish() });

export const createContribution = z.object({
  id: clientId,
  kind: z.enum(["deposit", "withdraw"]),
  amount: positiveAmount,
  date: isoDate,
  note,
});

export type SaveDebt = z.infer<typeof saveDebt>;
export type CreateDebt = z.infer<typeof createDebt>;
export type CreateDebtPayment = z.infer<typeof createDebtPayment>;
export type SaveGoal = z.infer<typeof saveGoal>;
export type CreateGoal = z.infer<typeof createGoal>;
export type CreateContribution = z.infer<typeof createContribution>;
