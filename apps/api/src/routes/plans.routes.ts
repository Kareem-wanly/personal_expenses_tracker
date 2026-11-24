import { Hono } from "hono";

import { debtController } from "../controllers/debt.controller";
import { goalController } from "../controllers/goal.controller";
import type { AppEnv } from "../lib/context";
import type { Services } from "../services";

export function plansRoutes(services: Services) {
  const debts = debtController(services.debts);
  const goals = goalController(services.goals);

  return new Hono<AppEnv>()
    .get("/debts", debts.index)
    .post("/debts", debts.create)
    .put("/debts/:id", debts.update)
    .delete("/debts/:id", debts.delete)
    .post("/debts/:id/settle", debts.settle)
    .post("/debts/:id/payments", debts.addPayment)
    .delete("/debts/:id/payments/:paymentId", debts.deletePayment)

    .get("/goals", goals.index)
    .post("/goals", goals.create)
    .put("/goals/:id", goals.update)
    .delete("/goals/:id", goals.delete)
    .post("/goals/:id/contributions", goals.addContribution)
    .delete("/goals/:id/contributions/:contributionId", goals.deleteContribution);
}
