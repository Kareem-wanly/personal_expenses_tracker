import type { JSONParsed } from "hono/utils/types";

import type * as Contract from "@masrufi/contracts/api/responses";

import type { categoryListView } from "../src/views/category.view";
import type { expenseListView, expenseRowView, incomeListView, recurringView } from "../src/views/ledger.view";
import type { debtView } from "../src/views/plans.view";
import type { profileView } from "../src/views/profile.view";
import type { dashboardView, reportView } from "../src/views/report.view";

/** Compiles only while every view still matches what clients were promised. */
type Json<View extends (...args: never[]) => unknown> = JSONParsed<ReturnType<View>>;
type Matches<Promised, Actual extends Promised> = Actual;

export type Checked = [
  Matches<Contract.Profile, Json<typeof profileView>>,
  Matches<Contract.Category[], Json<typeof categoryListView>>,
  Matches<Contract.ExpenseRow, Json<typeof expenseRowView>>,
  Matches<Contract.ExpenseList, Json<typeof expenseListView>>,
  Matches<Contract.IncomeList, Json<typeof incomeListView>>,
  Matches<Contract.RecurringRule, Json<typeof recurringView>>,
  Matches<Contract.Debt, Json<typeof debtView>>,
  Matches<Contract.Dashboard, Json<typeof dashboardView>>,
  Matches<Contract.Report, Json<typeof reportView>>,
];
