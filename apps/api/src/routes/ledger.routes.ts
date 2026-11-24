import { Hono } from "hono";

import { expenseController } from "../controllers/expense.controller";
import { incomeController } from "../controllers/income.controller";
import { recurringController } from "../controllers/recurring.controller";
import type { AppEnv } from "../lib/context";
import type { Services } from "../services";

export function ledgerRoutes(services: Services) {
  const expenses = expenseController(services.expenses);
  const incomes = incomeController(services.incomes);
  const recurring = recurringController(services.recurring);

  return new Hono<AppEnv>()
    .get("/expenses", expenses.index)
    .post("/expenses", expenses.create)
    .post("/expenses/batch", expenses.createBatch)
    .put("/expenses/:id", expenses.update)
    .delete("/expenses/:id", expenses.delete)

    .get("/incomes", incomes.index)
    .post("/incomes", incomes.create)
    .put("/incomes/:id", incomes.update)
    .delete("/incomes/:id", incomes.delete)

    .get("/recurring", recurring.index)
    .put("/recurring/:id", recurring.update)
    .post("/recurring/:id/pause", recurring.pause)
    .post("/recurring/:id/resume", recurring.resume)
    .delete("/recurring/:id", recurring.delete);
}
