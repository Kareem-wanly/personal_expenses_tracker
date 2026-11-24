import type { Debt } from "../models/debt.model";
import type { Goal } from "../models/goal.model";
import type { DebtDetails } from "../services/debt.service";
import type { GoalDetails } from "../services/goal.service";

type Movement = { id: string; amount: number; date: string; note: string | null };

const movementView = ({ id, amount, date, note }: Movement) => ({ id, amount, date, note });

export const debtView = (debt: Debt) => ({
  id: debt.id,
  direction: debt.direction,
  person: debt.person,
  amount: debt.amount,
  currency: debt.currency,
  date: debt.date,
  dueDate: debt.dueDate,
  note: debt.note,
  settledAt: debt.settledAt,
  updatedAt: debt.updatedAt,
});

export const debtDetailsView = ({ debt, payments, paid, state }: DebtDetails) => ({
  ...debtView(debt),
  paid,
  state,
  payments: payments.map(movementView),
});

export const goalView = (goal: Goal) => ({
  id: goal.id,
  name: goal.name,
  icon: goal.icon,
  target: goal.target,
  currency: goal.currency,
  deadline: goal.deadline,
  achievedAt: goal.achievedAt,
  updatedAt: goal.updatedAt,
});

export const goalDetailsView = ({ goal, contributions, saved, state }: GoalDetails) => ({
  ...goalView(goal),
  saved,
  state,
  contributions: contributions.map(movementView),
});
