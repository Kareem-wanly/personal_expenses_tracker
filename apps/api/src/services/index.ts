import type { Store } from "../models";
import { CategoryService } from "./category.service";
import { DashboardService } from "./dashboard.service";
import { DebtService } from "./debt.service";
import { ExpenseService } from "./expense.service";
import { GoalService } from "./goal.service";
import { IncomeService } from "./income.service";
import { InsightService } from "./insight.service";
import { ProfileService } from "./profile.service";
import { type RateSource, RateService } from "./rate.service";
import { RecurringService } from "./recurring.service";
import { ReportService } from "./report.service";

/** Business rules. Services know nothing about HTTP. */
export function createServices(store: Store, rateSource?: RateSource) {
  const recurring = new RecurringService(store);
  return {
    categories: new CategoryService(store),
    dashboard: new DashboardService(store, recurring),
    debts: new DebtService(store),
    expenses: new ExpenseService(store, recurring),
    goals: new GoalService(store),
    incomes: new IncomeService(store, recurring),
    insights: new InsightService(store, recurring),
    profile: new ProfileService(store),
    rates: new RateService(rateSource),
    recurring,
    reports: new ReportService(store, recurring),
  };
}

export type Services = ReturnType<typeof createServices>;
