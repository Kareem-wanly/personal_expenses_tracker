import type { Profile } from "@masrufi/contracts/api/responses";

import { write } from "@/api/write";
import { queryClient } from "@/api/query-client";
import { useAction } from "@/api/use-action";
import { Group, Row } from "@/ui/group";
import { Toggle } from "@/ui/toggle";

const ITEMS = [
  { key: "notifyBudget", title: "تنبيهات الميزانية", hint: "عند 80% من الميزانية وعند تجاوزها" },
  { key: "notifyDailyReminder", title: "تذكير يومي مسائي", hint: "فقط إذا لم تسجّل شيئاً في ذلك اليوم" },
  { key: "notifyMonthlySummary", title: "الملخص الشهري", hint: "في أول كل شهر مع مقارنة بالسابق" },
  { key: "notifyDebts", title: "مواعيد الديون", hint: "يوم الاستحقاق واليوم الذي قبله" },
  { key: "notifyRecurring", title: "المصاريف المتكررة", hint: "مساء اليوم السابق لإضافتها" },
] as const;

export function NotificationGroup({ me }: { me: Profile }) {
  const { busy, run } = useAction();
  const change = async (key: (typeof ITEMS)[number]["key"], on: boolean) => {
    // Shown at once; read again from the server if it refused.
    queryClient.setQueryData<Profile>(["me"], (current) => current && { ...current, [key]: on });
    const saved = await run(() => write.patch<Profile>("/me", { [key]: on }), () => undefined);
    if (!saved) await queryClient.invalidateQueries({ queryKey: ["me"] });
  };
  return (
    <Group title="الإشعارات">
      {ITEMS.map(({ key, title, hint }) => (
        <Row
          key={key}
          title={title}
          subtitle={hint}
          trailing={<Toggle label={title} value={me[key]} disabled={busy} onChange={(on) => void change(key, on)} />}
        />
      ))}
    </Group>
  );
}
