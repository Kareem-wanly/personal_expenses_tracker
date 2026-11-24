import { updateRecurring } from "@masrufi/contracts/api/ledger";

import type { AppContext } from "../lib/context";
import { readBody, readParam } from "../lib/request";
import type { RecurringService } from "../services/recurring.service";
import { recurringListView, recurringView } from "../views/ledger.view";

export const recurringController = (recurring: RecurringService) => ({
  index: async (c: AppContext) =>
    c.json({ data: recurringListView(await recurring.list(c.get("user"))) }),

  update: async (c: AppContext) => {
    const input = await readBody(c, updateRecurring);
    const rule = await recurring.update(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: recurringView(rule) });
  },

  pause: async (c: AppContext) =>
    c.json({ data: recurringView(await recurring.pause(c.get("user"), readParam(c, "id"))) }),

  resume: async (c: AppContext) =>
    c.json({ data: recurringView(await recurring.resume(c.get("user"), readParam(c, "id"))) }),

  delete: async (c: AppContext) => {
    await recurring.delete(c.get("user"), readParam(c, "id"));
    return c.body(null, 204);
  },
});
