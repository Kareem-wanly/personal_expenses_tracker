import { ruleBroken } from "../lib/errors";
import type { Models } from "../models";

/** Refuses categories that don't exist or belong to someone else. */
export async function assertCategoriesOwned(models: Models, userId: string, ids: (string | null)[]) {
  const wanted = [...new Set(ids.filter((id) => id !== null))];
  if (wanted.length === 0) return;
  if ((await models.categories.countOwned(userId, wanted)) < wanted.length) {
    throw ruleBroken("التصنيف غير موجود", "categoryId");
  }
}
