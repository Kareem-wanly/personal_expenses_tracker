import { createContribution, createGoal, saveGoal } from "@masrufi/contracts/api/plans";

import type { AppContext } from "../lib/context";
import { readBody, readParam } from "../lib/request";
import type { GoalService } from "../services/goal.service";
import { goalDetailsView, goalView } from "../views/plans.view";

export const goalController = (goals: GoalService) => ({
  index: async (c: AppContext) =>
    c.json({ data: (await goals.list(c.get("user"))).map(goalDetailsView) }),

  create: async (c: AppContext) => {
    const input = await readBody(c, createGoal);
    return c.json({ data: goalView(await goals.create(c.get("user"), input)) }, 201);
  },

  update: async (c: AppContext) => {
    const input = await readBody(c, saveGoal);
    const goal = await goals.update(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: goalView(goal) });
  },

  delete: async (c: AppContext) => {
    await goals.delete(c.get("user"), readParam(c, "id"));
    return c.body(null, 204);
  },

  addContribution: async (c: AppContext) => {
    const input = await readBody(c, createContribution);
    const goal = await goals.addContribution(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: goalView(goal) }, 201);
  },

  deleteContribution: async (c: AppContext) => {
    const contributionId = readParam(c, "contributionId");
    await goals.deleteContribution(c.get("user"), readParam(c, "id"), contributionId);
    return c.body(null, 204);
  },
});
