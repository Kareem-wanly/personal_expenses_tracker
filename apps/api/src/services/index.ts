import { BackgroundTasks } from "../lib/background";
import type { PushSender } from "../lib/push-sender";
import type { Store } from "../models";
import { BackupService } from "./backup/backup.service";
import { CategoryService } from "./category.service";
import { DashboardService } from "./dashboard.service";
import { DebtService } from "./debt.service";
import { ExpenseService } from "./expense.service";
import { ExportService } from "./export.service";
import { GoalService } from "./goal.service";
import { IncomeService } from "./income.service";
import { InsightService } from "./insight.service";
import { BudgetAlertService } from "./notifications/budget-alert.service";
import { DailyJobService } from "./notifications/daily-job.service";
import { DeviceService } from "./notifications/device.service";
import { NotifierService } from "./notifications/notifier.service";
import { ProfileService } from "./profile.service";
import { type RateSource, RateService } from "./rate.service";
import { RecurringService } from "./recurring.service";
import { ReportService } from "./report.service";

export type ServiceOptions = {
  pushSender?: PushSender | null;
  rateSource?: RateSource;
  background?: BackgroundTasks;
};

/** Business rules. Services know nothing about HTTP. */
export function createServices(store: Store, options: ServiceOptions = {}) {
  const { pushSender = null, rateSource, background = new BackgroundTasks() } = options;
  const recurring = new RecurringService(store);
  const debts = new DebtService(store);
  const notifier = new NotifierService(store, pushSender);
  const alerts = new BudgetAlertService(store, notifier, background);
  return {
    backups: new BackupService(store),
    categories: new CategoryService(store),
    dailyJob: new DailyJobService(store, recurring, debts, notifier),
    dashboard: new DashboardService(store, recurring),
    debts,
    devices: new DeviceService(store, notifier),
    expenses: new ExpenseService(store, recurring, alerts),
    exports: new ExportService(store, recurring),
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
