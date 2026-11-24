import { z } from "zod";

import { currencyCode, isoMonth } from "@masrufi/contracts/api/common";

import type { AppContext } from "../lib/context";
import { readQuery } from "../lib/request";
import type { Services } from "../services";
import { dashboardView, reportView } from "../views/report.view";

const monthQuery = z.object({ month: isoMonth });
const rateQuery = z.object({ from: currencyCode, to: currencyCode });

/** Read-only screens. */
export const reportController = ({ dashboard, insights, rates, reports }: Services) => ({
  dashboard: async (c: AppContext) =>
    c.json({ data: dashboardView(await dashboard.get(c.get("user"))) }),

  monthly: async (c: AppContext) => {
    const { month } = readQuery(c, monthQuery);
    return c.json({ data: reportView(await reports.monthly(c.get("user"), month)) });
  },

  insights: async (c: AppContext) => {
    const { month } = readQuery(c, monthQuery);
    return c.json({ data: await insights.monthly(c.get("user"), month) });
  },

  rate: async (c: AppContext) => {
    const { from, to } = readQuery(c, rateQuery);
    return c.json({ data: { from, to, rate: await rates.get(from, to) } });
  },
});
