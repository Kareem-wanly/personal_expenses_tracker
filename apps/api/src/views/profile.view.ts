import type { User } from "../models/user.model";

/** The V in MVC: what the outside world sees of a row. */
export const profileView = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  currency: user.currency,
  monthlyBudget: user.monthlyBudget,
  timezone: user.timezone,
  notifyBudget: user.notifyBudget,
  notifyDailyReminder: user.notifyDailyReminder,
  notifyMonthlySummary: user.notifyMonthlySummary,
  notifyRecurring: user.notifyRecurring,
  notifyDebts: user.notifyDebts,
});
