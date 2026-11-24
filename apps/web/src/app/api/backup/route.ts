import { type NextRequest } from "next/server";

import { backupSchema } from "@masrufi/contracts/backup";

import { buildBackup, restoreBackup } from "@/lib/backup";
import { getCurrentUser } from "@/lib/dal";

/** Larger than a Server Action allows (1 MB): years of data fit here. */
const MAX_BYTES = 4 * 1024 * 1024;

/** Download everything as one JSON file. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const backup = await buildBackup(user.id);
  const day = backup.exportedAt.slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="masroofi-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Restore (merge) a backup file into the signed-in account. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرّح" }, { status: 401 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) {
    return Response.json({ error: "الملف كبير جداً (الحد 4 ميغابايت)" }, { status: 413 });
  }

  let json: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BYTES) {
      return Response.json({ error: "الملف كبير جداً (الحد 4 ميغابايت)" }, { status: 413 });
    }
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "الملف ليس JSON صالحاً" }, { status: 400 });
  }

  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "هذا ليس ملف نسخة احتياطية من مصروفي، أو أنه تالف" }, { status: 400 });
  }

  const result = await restoreBackup(user.id, parsed.data);
  return Response.json({ ok: true, result });
}
