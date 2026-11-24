import { z } from "zod";

import { isoMonth } from "@masrufi/contracts/api/common";
import { backupSchema } from "@masrufi/contracts/backup";

import type { AppContext } from "../lib/context";
import { readBody, readQuery } from "../lib/request";
import type { Services } from "../services";
import { csvView } from "../views/csv.view";

const attachment = (name: string) => ({
  "Content-Disposition": `attachment; filename="${name}"`,
  "Cache-Control": "no-store",
});

/** Taking data out, and bringing it back. */
export const dataController = ({ backups, exports }: Services) => ({
  backup: async (c: AppContext) => {
    const backup = await backups.build(c.get("user"));
    return c.json(backup, 200, attachment(`masroofi-backup-${backup.exportedAt.slice(0, 10)}.json`));
  },

  restore: async (c: AppContext) => {
    const backup = await readBody(c, backupSchema);
    return c.json({ data: await backups.restore(c.get("user"), backup) });
  },

  csv: async (c: AppContext) => {
    const { month } = readQuery(c, z.object({ month: isoMonth }));
    const csv = csvView(await exports.month(c.get("user"), month));
    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      ...attachment(`masroofi-${month}.csv`),
    });
  },
});
