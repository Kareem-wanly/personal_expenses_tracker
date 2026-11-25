import { useRouter } from "expo-router";

import { todayISO } from "@masrufi/core/dates";

import { write } from "@/api/write";
import { isQueued } from "@/api/write-policy";
import { useProfile } from "@/api/queries";
import { queryClient } from "@/api/query-client";
import { SAVED_ON_PHONE } from "@/api/use-action";
import { type EditableEntry, copyOf, pathOf } from "@/features/ledger/entry";
import { haptics } from "@/motion/haptics";
import { showToast } from "@/ui/toast-store";

async function attempt(work: () => Promise<unknown>, done: () => void) {
  try {
    const result = await work();
    haptics.success();
    if (isQueued(result)) showToast(SAVED_ON_PHONE);
    else done();
  } catch (error) {
    haptics.error();
    showToast(error instanceof Error ? error.message : "حدث خطأ", { tone: "error" });
  }
  await queryClient.invalidateQueries();
}

/** What can be done to an entry without opening the form. */
export function useEntryActions() {
  const router = useRouter();
  const timezone = useProfile().data?.timezone;

  const save = (entry: EditableEntry, date: string, message: string) =>
    attempt(() => write.post(pathOf(entry.kind), copyOf(entry, date)), () => showToast(message));

  return {
    edit: (entry: EditableEntry) =>
      router.push({ pathname: "/entry", params: { kind: entry.kind, entry: JSON.stringify(entry.item) } }),

    repeatToday: (entry: EditableEntry) => save(entry, todayISO(timezone), "تمت إضافة نسخة بتاريخ اليوم"),

    /** Straight away, with a way back. */
    remove: (entry: EditableEntry) =>
      attempt(
        () => write.delete(`${pathOf(entry.kind)}/${entry.item.id}`),
        () =>
          showToast("تم الحذف", {
            action: { label: "تراجع", run: () => void save(entry, entry.item.date, "تمت الاستعادة") },
          }),
      ),
  };
}
