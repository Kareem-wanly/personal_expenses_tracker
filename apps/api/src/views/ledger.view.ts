import type { Expense, ExpenseRow } from "../models/expense.model";
import type { Income } from "../models/income.model";
import type { RecurringRule } from "../models/recurring.model";

type CategoryLabel = { name: string; icon: string; color: string } | null;

export const expenseView = (expense: Expense) => ({
  id: expense.id,
  amount: expense.amount,
  categoryId: expense.categoryId,
  date: expense.date,
  note: expense.note,
  paymentMethod: expense.paymentMethod,
  recurringId: expense.recurringId,
  originalAmount: expense.originalAmount,
  originalCurrency: expense.originalCurrency,
  updatedAt: expense.updatedAt,
});

export const expenseRowView = ({ expense, category }: ExpenseRow) => ({
  ...expenseView(expense),
  category,
});

/** Newest day first; rows already arrive in that order. */
export function expenseListView(rows: ExpenseRow[]) {
  const days = [...Map.groupBy(rows, (row) => row.expense.date)].map(([date, items]) => ({
    date,
    total: items.reduce((sum, item) => sum + item.expense.amount, 0),
    items: items.map(expenseRowView),
  }));
  return { total: days.reduce((sum, day) => sum + day.total, 0), count: rows.length, days };
}

export const incomeView = (income: Income) => ({
  id: income.id,
  amount: income.amount,
  source: income.source,
  date: income.date,
  note: income.note,
  recurringId: income.recurringId,
  originalAmount: income.originalAmount,
  originalCurrency: income.originalCurrency,
  updatedAt: income.updatedAt,
});

export const incomeListView = (incomes: Income[]) => ({
  total: incomes.reduce((sum, income) => sum + income.amount, 0),
  items: incomes.map(incomeView),
});

export const recurringView = (rule: RecurringRule) => ({
  id: rule.id,
  kind: rule.kind,
  amount: rule.amount,
  categoryId: rule.categoryId,
  source: rule.source,
  note: rule.note,
  paymentMethod: rule.paymentMethod,
  frequency: rule.frequency,
  nextDate: rule.nextDate,
  active: rule.active,
  updatedAt: rule.updatedAt,
});

export const recurringListView = (rows: { rule: RecurringRule; category: CategoryLabel }[]) =>
  rows.map(({ rule, category }) => ({ ...recurringView(rule), category }));
