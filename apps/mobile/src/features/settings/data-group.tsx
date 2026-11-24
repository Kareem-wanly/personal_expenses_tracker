import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";

import { monthOf, todayISO } from "@masrufi/core/dates";

import { api } from "@/api/client";
import { SITE_URL } from "@/api/config";
import { useProfile } from "@/api/queries";
import { useAction } from "@/api/use-action";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import { shareFile } from "@/lib/share-file";
import { Group, Row } from "@/ui/group";
import { showToast } from "@/ui/toast-store";

type Restored = Record<"categories" | "expenses" | "incomes" | "recurring" | "debts" | "goals", number>;

function announce(restored: Restored) {
  const added = Object.values(restored).reduce((sum, count) => sum + count, 0);
  showToast(
    added === 0
      ? "النسخة مستعادة مسبقاً، لا شيء جديد"
      : `تمت الاستعادة: ${restored.expenses} مصروف، ${restored.incomes} دخل، ${restored.debts} دين، ${restored.goals} هدف`,
  );
}

async function readChosenFile(): Promise<unknown> {
  const chosen = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (chosen.canceled) return null;
  const response = await fetch(chosen.assets[0].uri);
  return response.json().catch(() => {
    throw new Error("هذا ليس ملف نسخة احتياطية");
  });
}

/** Taking data out, bringing it back, and reading about it. */
export function DataGroup() {
  const open = useOpenSheet();
  const today = todayISO(useProfile().data?.timezone);
  const { busy, run } = useAction();
  const quiet = () => undefined;

  const exportCsv = () =>
    run(async () => {
      const month = monthOf(today);
      await shareFile(`masroofi-${month}.csv`, await api.text(`/export?month=${month}`), "text/csv");
    }, quiet);

  const backUp = () =>
    run(async () => {
      await shareFile(`masroofi-backup-${today}.json`, await api.text("/backup"), "application/json");
    }, quiet);

  async function restore() {
    const file = await readChosenFile().catch((error: Error) => showToast(error.message, { tone: "error" }));
    if (file) await run(() => api.post<Restored>("/backup/restore", file), announce);
  }

  const unlessBusy = (work: () => unknown) => () => {
    if (!busy) void work();
  };
  return (
    <Group title="بياناتك">
      <Row icon="download" title="تصدير الشهر (CSV)" subtitle="يُفتح في Excel" onPress={unlessBusy(exportCsv)} />
      <Row icon="download" title="نسخة احتياطية كاملة" onPress={unlessBusy(backUp)} />
      <Row icon="upload" title="استعادة من نسخة" subtitle="لا يتكرر ما هو موجود" onPress={unlessBusy(restore)} />
      <Row icon="sparkle" title="ما الجديد" onPress={() => open("whats-new")} />
      <Row icon="shield" title="سياسة الخصوصية" onPress={() => void Linking.openURL(`${SITE_URL}/privacy`)} />
    </Group>
  );
}
