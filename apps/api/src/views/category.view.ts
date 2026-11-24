import type { Category } from "../models/category.model";

export const categoryView = (category: Category) => ({
  id: category.id,
  name: category.name,
  icon: category.icon,
  color: category.color,
  budget: category.budget,
  sortOrder: category.sortOrder,
  updatedAt: category.updatedAt,
});

export const categoryListView = (rows: { category: Category; expenseCount: number }[]) =>
  rows.map(({ category, expenseCount }) => ({ ...categoryView(category), expenseCount }));
