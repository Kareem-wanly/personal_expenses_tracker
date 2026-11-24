import type { CreateCategory, SaveCategory } from "@masrufi/contracts/api/categories";

import { conflict, isUniqueViolation, notFound } from "../lib/errors";
import type { Store } from "../models";
import type { User } from "../models/user.model";

const MISSING = "التصنيف غير موجود";

/** The only unique rule a category can break is its name. */
async function withUniqueName<T>(save: () => Promise<T>): Promise<T> {
  try {
    return await save();
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict("يوجد تصنيف بنفس الاسم", "name");
    throw error;
  }
}

export class CategoryService {
  constructor(private readonly store: Store) {}

  list(user: User) {
    return this.store.categories.list(user.id);
  }

  async create(user: User, input: CreateCategory) {
    const { categories } = this.store;
    const sortOrder = await categories.nextSortOrder(user.id);
    const created = await withUniqueName(() =>
      categories.insert({ ...input, userId: user.id, sortOrder }),
    );
    return created ?? this.alreadyCreated(user, input.id);
  }

  async update(user: User, id: string, input: SaveCategory) {
    const updated = await withUniqueName(() => this.store.categories.update(user.id, id, input));
    if (!updated) throw notFound(MISSING);
    return updated;
  }

  /** Its expenses stay and become uncategorized. */
  async delete(user: User, id: string): Promise<void> {
    await this.store.transaction(async (models) => {
      if (!(await models.categories.delete(user.id, id))) throw notFound(MISSING);
      await models.expenses.clearCategory(user.id, id);
      await models.recurring.clearCategory(user.id, id);
    });
  }

  private async alreadyCreated(user: User, id = "") {
    const existing = await this.store.categories.find(user.id, id);
    if (!existing) throw conflict("المعرّف مستخدم من قبل");
    return existing;
  }
}
