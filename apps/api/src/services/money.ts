import type { User } from "../models/user.model";
import { ruleBroken } from "../lib/errors";

type Typed = { amount: number; currency?: string; rate?: number };

/** Money in another currency is stored converted, along with what was typed. */
export function toUserCurrency(user: User, { amount, currency, rate }: Typed) {
  if (!currency || currency === user.currency) {
    return { amount, originalAmount: null, originalCurrency: null };
  }
  if (!rate) throw ruleBroken("أدخل سعر الصرف", "rate");
  const converted = Math.round(amount * rate);
  if (converted < 1 || converted > Number.MAX_SAFE_INTEGER) {
    throw ruleBroken("سعر صرف غير صالح", "rate");
  }
  return { amount: converted, originalAmount: amount, originalCurrency: currency };
}
