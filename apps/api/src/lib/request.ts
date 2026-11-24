import { z } from "zod";

import type { AppContext } from "./context";
import { AppError } from "./errors";

function parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    (fields[issue.path.join(".") || "_"] ??= []).push(issue.message);
  }
  throw new AppError(422, "invalid_input", "تحقّق من الحقول المدخلة", fields);
}

/** The JSON body, validated. Other content types are refused (also blocks form-based CSRF). */
export async function readBody<T extends z.ZodType>(c: AppContext, schema: T): Promise<z.infer<T>> {
  if (!c.req.header("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new AppError(415, "unsupported_media_type", "الطلب يجب أن يكون JSON");
  }
  const body = await c.req.json().catch(() => {
    throw new AppError(400, "invalid_json", "تعذّرت قراءة الطلب");
  });
  return parse(schema, body);
}

export const readQuery = <T extends z.ZodType>(c: AppContext, schema: T): z.infer<T> =>
  parse(schema, c.req.query());

export function readParam(c: AppContext, name: string): string {
  return parse(z.string().min(1).max(64), c.req.param(name));
}
