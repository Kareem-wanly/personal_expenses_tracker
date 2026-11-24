import { createExpense, createExpenseBatch, expenseFilters, updateExpense } from "@masrufi/contracts/api/ledger";

import type { AppContext } from "../lib/context";
import { readBody, readParam, readQuery } from "../lib/request";
import type { ExpenseService } from "../services/expense.service";
import { expenseListView, expenseView } from "../views/ledger.view";

export const expenseController = (expenses: ExpenseService) => ({
  index: async (c: AppContext) => {
    const filters = readQuery(c, expenseFilters);
    return c.json({ data: expenseListView(await expenses.list(c.get("user"), filters)) });
  },

  create: async (c: AppContext) => {
    const input = await readBody(c, createExpense);
    return c.json({ data: expenseView(await expenses.create(c.get("user"), input)) }, 201);
  },

  createBatch: async (c: AppContext) => {
    const input = await readBody(c, createExpenseBatch);
    const created = await expenses.createBatch(c.get("user"), input);
    return c.json({ data: created.map(expenseView) }, 201);
  },

  update: async (c: AppContext) => {
    const input = await readBody(c, updateExpense);
    const expense = await expenses.update(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: expenseView(expense) });
  },

  delete: async (c: AppContext) => {
    await expenses.delete(c.get("user"), readParam(c, "id"));
    return c.body(null, 204);
  },
});
