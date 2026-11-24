import type { DashboardService } from "../services/dashboard.service";
import type { ReportService } from "../services/report.service";
import { expenseRowView, incomeView } from "./ledger.view";

type Dashboard = Awaited<ReturnType<DashboardService["get"]>>;
type Report = Awaited<ReturnType<ReportService["monthly"]>>;

export const dashboardView = (dashboard: Dashboard) => ({
  ...dashboard,
  recent: dashboard.recent.map(expenseRowView),
});

export const reportView = (report: Report) => ({
  ...report,
  top: report.top.map(expenseRowView),
  incomes: report.incomes.map(incomeView),
});
