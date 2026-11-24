import type { Db } from "../database/client";
import { CategoryModel } from "./category.model";
import { DebtModel } from "./debt.model";
import { DebtPaymentModel } from "./debt-payment.model";
import { DeviceModel } from "./device.model";
import { ExpenseModel } from "./expense.model";
import { ExpenseStatsModel } from "./expense-stats.model";
import { GoalContributionModel } from "./goal-contribution.model";
import { GoalModel } from "./goal.model";
import { IncomeModel } from "./income.model";
import { OccurrenceModel } from "./occurrence.model";
import { RecurringModel } from "./recurring.model";
import { RestoreModel } from "./restore.model";
import { UserModel } from "./user.model";

/** One model per table: the only place that talks to the database. */
export function createModels(db: Db) {
  return {
    categories: new CategoryModel(db),
    contributions: new GoalContributionModel(db),
    debtPayments: new DebtPaymentModel(db),
    debts: new DebtModel(db),
    devices: new DeviceModel(db),
    expenses: new ExpenseModel(db),
    expenseStats: new ExpenseStatsModel(db),
    goals: new GoalModel(db),
    incomes: new IncomeModel(db),
    occurrences: new OccurrenceModel(db),
    recurring: new RecurringModel(db),
    restore: new RestoreModel(db),
    users: new UserModel(db),
  };
}

export type Models = ReturnType<typeof createModels>;

/** Models, plus a way to run several of their calls as one all-or-nothing step. */
export type Store = Models & {
  transaction: <T>(work: (models: Models) => Promise<T>) => Promise<T>;
};

export function createStore(db: Db): Store {
  return {
    ...createModels(db),
    transaction: (work) => db.transaction((tx) => work(createModels(tx))),
  };
}
