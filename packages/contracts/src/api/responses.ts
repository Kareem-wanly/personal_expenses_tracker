import type {
  DebtDirection,
  Frequency,
  IncomeSource,
  PaymentMethod,
  RecurringKind,
} from "@masrufi/core/enums";
import type { Insight } from "@masrufi/core/insights";
import type { DebtState, GoalState } from "@masrufi/core/plans";

/** What the API answers (inside `data`). apps/api checks its views against these. */

export type Profile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  currency: string;
  monthlyBudget: number | null;
  timezone: string;
  notifyBudget: boolean;
  notifyDailyReminder: boolean;
  notifyMonthlySummary: boolean;
  notifyRecurring: boolean;
  notifyDebts: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number | null;
  sortOrder: number;
  expenseCount: number;
  updatedAt: string;
};

export type CategoryLabel = { name: string; icon: string; color: string };

type Entry = {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  recurringId: string | null;
  originalAmount: number | null;
  originalCurrency: string | null;
  updatedAt: string;
};

export type Expense = Entry & { categoryId: string | null; paymentMethod: PaymentMethod };
export type ExpenseRow = Expense & { category: CategoryLabel | null };
export type Income = Entry & { source: IncomeSource };

export type ExpenseList = {
  total: number;
  count: number;
  days: { date: string; total: number; items: ExpenseRow[] }[];
};

export type IncomeList = { total: number; items: Income[] };

export type RecurringRule = {
  id: string;
  kind: RecurringKind;
  amount: number;
  categoryId: string | null;
  source: IncomeSource | null;
  note: string | null;
  paymentMethod: PaymentMethod;
  frequency: Frequency;
  nextDate: string;
  active: boolean;
  updatedAt: string;
};

export type Debt = {
  id: string;
  direction: DebtDirection;
  person: string;
  amount: number;
  currency: string;
  date: string;
  dueDate: string | null;
  note: string | null;
  settledAt: string | null;
  updatedAt: string;
};

export type RecurringRow = RecurringRule & { category: CategoryLabel | null };

/** A payment, deposit or withdrawal (negative). */
export type Movement = { id: string; amount: number; date: string; note: string | null };

export type DebtDetails = Debt & { paid: number; state: DebtState; payments: Movement[] };

export type Goal = {
  id: string;
  name: string;
  icon: string;
  target: number;
  currency: string;
  deadline: string | null;
  achievedAt: string | null;
  updatedAt: string;
};

export type GoalDetails = Goal & { saved: number; state: GoalState; contributions: Movement[] };

export type CategoryTotal = CategoryLabel & {
  categoryId: string | null;
  budget: number | null;
  total: number;
  count: number;
};

export type Dashboard = {
  today: string;
  month: string;
  spent: number;
  todayTotal: number;
  weekTotal: number;
  byCategory: CategoryTotal[];
  recent: ExpenseRow[];
  earned: number;
  hasIncome: boolean;
  balance: number;
  dailyAverage: number;
  projected: number;
  daysLeft: number;
  pace: number;
};

export type DayTotal = { day: number; date: string; total: number };

export type Report = {
  month: string;
  isCurrent: boolean;
  total: number;
  previousTotal: number;
  change: number | null;
  count: number;
  byCategory: CategoryTotal[];
  byMethod: { method: PaymentMethod; total: number }[];
  daily: DayTotal[];
  trend: { month: string; total: number; income: number }[];
  top: ExpenseRow[];
  dailyAverage: number;
  projected: number | null;
  spendingDays: number;
  maxDay: DayTotal | null;
  incomes: Income[];
  earned: number;
  net: number;
};

export type { Insight };

export type Rate = { from: string; to: string; rate: number | null };

export type ApiFailure = {
  error: { code: string; message: string; fields?: Record<string, string[]> };
};
