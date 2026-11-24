/**
 * Seeds ~3 months of realistic demo expenses for an EXISTING user.
 *
 *   npm run db:seed -- you@example.com
 *
 * Register the account in the app first (that also creates default categories).
 *
 * Local-only demo account used while developing (local.db, never production):
 *   email: demo@example.com   password: DemoPass-2026!
 */
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@masrufi/db/schema";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run db:seed -- <email>");
  process.exit(1);
}

const db = drizzle(
  createClient({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
  { schema },
);

const NOTES: Record<string, string[]> = {
  "طعام وشراب": ["قهوة", "غداء", "عشاء مع العائلة", "سوبرماركت", "فطور"],
  مواصلات: ["بنزين", "تاكسي", "باص", "موقف سيارات"],
  فواتير: ["كهرباء", "إنترنت", "رصيد جوال", "ماء"],
  تسوّق: ["ملابس", "حذاء", "أدوات منزلية"],
  صحة: ["صيدلية", "طبيب أسنان", "فيتامينات"],
  ترفيه: ["سينما", "اشتراك نتفليكس", "نزهة"],
  منزل: ["تنظيف", "صيانة", "أثاث"],
  تعليم: ["كتاب", "دورة أونلاين"],
  أخرى: ["هدية", "تبرّع"],
};

const WEIGHTS: Record<string, [number, number, number]> = {
  // [probability per day, min, max] in major units
  "طعام وشراب": [0.9, 3, 45],
  مواصلات: [0.5, 2, 30],
  فواتير: [0.08, 15, 120],
  تسوّق: [0.12, 10, 150],
  صحة: [0.06, 5, 80],
  ترفيه: [0.12, 5, 40],
  منزل: [0.05, 10, 200],
  تعليم: [0.03, 10, 60],
  أخرى: [0.04, 5, 50],
};

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const pad = (n: number) => String(n).padStart(2, "0");

async function main() {
  const user = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (!user) throw new Error(`No user with email ${email} — register in the app first.`);

  const categories = await db.query.category.findMany({
    where: eq(schema.category.userId, user.id),
  });

  const rows: (typeof schema.expense.$inferInsert)[] = [];
  const today = new Date();
  for (let i = 0; i < 95; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    for (const c of categories) {
      const [p, min, max] = WEIGHTS[c.name] ?? [0.05, 5, 50];
      if (Math.random() < p) {
        rows.push({
          userId: user.id,
          categoryId: c.id,
          amount: Math.round((min + Math.random() * (max - min)) * 100),
          note: pick(NOTES[c.name] ?? [""]) || null,
          date,
          paymentMethod: pick(["cash", "cash", "card", "card", "transfer"] as const),
        });
      }
    }
  }

  await db.insert(schema.expense).values(rows);
  await db
    .update(schema.user)
    .set({ monthlyBudget: 150000 })
    .where(eq(schema.user.id, user.id));
  console.log(`✅ Inserted ${rows.length} expenses for ${email} (budget set to 1,500)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
