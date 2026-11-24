import { Hono } from "hono";

import { categoryController } from "../controllers/category.controller";
import { profileController } from "../controllers/profile.controller";
import { reportController } from "../controllers/report.controller";
import type { AppEnv } from "../lib/context";
import type { Services } from "../services";
import { ledgerRoutes } from "./ledger.routes";
import { plansRoutes } from "./plans.routes";

/** Every route below /v1 requires a signed-in user. */
export function createRoutes(services: Services) {
  const profile = profileController(services.profile);
  const categories = categoryController(services.categories);
  const reports = reportController(services);

  return new Hono<AppEnv>()
    .get("/me", profile.show)
    .patch("/me", profile.update)

    .get("/categories", categories.index)
    .post("/categories", categories.create)
    .put("/categories/:id", categories.update)
    .delete("/categories/:id", categories.delete)

    .get("/dashboard", reports.dashboard)
    .get("/reports/monthly", reports.monthly)
    .get("/insights", reports.insights)
    .get("/rates", reports.rate)

    .route("/", ledgerRoutes(services))
    .route("/", plansRoutes(services));
}
