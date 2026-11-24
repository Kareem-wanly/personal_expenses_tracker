import { z } from "zod";

import { budgetAmount, clientId, icon, requiredText } from "./common";

export const saveCategory = z.object({
  name: requiredText(30, "أدخل اسم التصنيف"),
  icon,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح"),
  budget: budgetAmount.default(null),
});

export const createCategory = saveCategory.extend({ id: clientId });

export type SaveCategory = z.infer<typeof saveCategory>;
export type CreateCategory = z.infer<typeof createCategory>;
