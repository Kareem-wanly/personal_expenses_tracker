import type { Context } from "hono";

import type { User } from "../models/user.model";

/** What middleware makes available to controllers. */
export type AppEnv = { Variables: { user: User } };

export type AppContext = Context<AppEnv>;
