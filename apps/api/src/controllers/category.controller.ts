import { createCategory, saveCategory } from "@masrufi/contracts/api/categories";

import type { AppContext } from "../lib/context";
import { readBody, readParam } from "../lib/request";
import type { CategoryService } from "../services/category.service";
import { categoryListView, categoryView } from "../views/category.view";

export const categoryController = (categories: CategoryService) => ({
  index: async (c: AppContext) =>
    c.json({ data: categoryListView(await categories.list(c.get("user"))) }),

  create: async (c: AppContext) => {
    const input = await readBody(c, createCategory);
    return c.json({ data: categoryView(await categories.create(c.get("user"), input)) }, 201);
  },

  update: async (c: AppContext) => {
    const input = await readBody(c, saveCategory);
    const category = await categories.update(c.get("user"), readParam(c, "id"), input);
    return c.json({ data: categoryView(category) });
  },

  delete: async (c: AppContext) => {
    await categories.delete(c.get("user"), readParam(c, "id"));
    return c.body(null, 204);
  },
});
