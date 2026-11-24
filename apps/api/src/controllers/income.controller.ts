import { z } from "zod";

import { isoMonth } from "@masrufi/contracts/api/common";
import { createIncome, updateIncome } from "@masrufi/contracts/api/ledger";

import type { AppContext } from "../lib/context";
import { readBody, readParam, readQuery } from "../lib/request";
import type { IncomeService } from "../services/income.service";
import { incomeListView, incomeView } from "../views/ledger.view";

export const incomeController = (incomes: IncomeService) => ({
  index: async (c: AppContext) => {
    const { month } = readQuery(c, z.object({ month: isoMonth }));
    return c.json({ data: incomeListView(await incomes.list(c.get("user"), month)) });
  },

  create: async (c: AppContext) => {
    const input = await readBody(c, createIncome);
    return c.json({ data: incomeView(await incomes.create(c.get("user"), input)) }, 201);
  },

  update: async (c: AppContext) => {
    const input = await readBody(c, updateIncome);
    const income = await incomes.update(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: incomeView(income) });
  },

  delete: async (c: AppContext) => {
    await incomes.delete(c.get("user"), readParam(c, "id"));
    return c.body(null, 204);
  },
});
