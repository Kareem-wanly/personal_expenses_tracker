import { createDebt, createDebtPayment, saveDebt } from "@masrufi/contracts/api/plans";

import type { AppContext } from "../lib/context";
import { readBody, readParam } from "../lib/request";
import type { DebtService } from "../services/debt.service";
import { debtDetailsView, debtView } from "../views/plans.view";

export const debtController = (debts: DebtService) => ({
  index: async (c: AppContext) =>
    c.json({ data: (await debts.list(c.get("user"))).map(debtDetailsView) }),

  create: async (c: AppContext) => {
    const input = await readBody(c, createDebt);
    return c.json({ data: debtView(await debts.create(c.get("user"), input)) }, 201);
  },

  update: async (c: AppContext) => {
    const input = await readBody(c, saveDebt);
    const debt = await debts.update(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: debtView(debt) });
  },

  delete: async (c: AppContext) => {
    await debts.delete(c.get("user"), readParam(c, "id"));
    return c.body(null, 204);
  },

  settle: async (c: AppContext) =>
    c.json({ data: debtView(await debts.settle(c.get("user"), readParam(c, "id"))) }),

  addPayment: async (c: AppContext) => {
    const input = await readBody(c, createDebtPayment);
    const debt = await debts.addPayment(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: debtView(debt) }, 201);
  },

  deletePayment: async (c: AppContext) => {
    const debt = await debts.deletePayment(c.get("user"), readParam(c, "id"), readParam(c, "paymentId"));
    return c.json({ data: debtView(debt) });
  },
});
