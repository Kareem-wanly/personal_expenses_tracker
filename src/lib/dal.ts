import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db, schema } from "@/db";
import { auth } from "@/lib/auth";

/**
 * Data Access Layer entry point.
 *
 * Every server read/write goes through `requireUser()` so authorization is
 * enforced next to the data — never trust the client or the proxy alone.
 * `cache()` dedupes the lookup within a single request.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const row = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      currency: true,
      monthlyBudget: true,
    },
  });
  return row ?? null;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
