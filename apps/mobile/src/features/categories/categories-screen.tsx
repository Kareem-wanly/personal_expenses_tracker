import { formatMoney } from "@masrufi/core/money";
import { countExpenses } from "@masrufi/core/plural";

import { useCategories, useProfile } from "@/api/queries";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import { Reveal } from "@/motion/reveal";
import { Group, Row } from "@/ui/group";
import { PageHeader } from "@/ui/page-header";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";

export function CategoriesScreen() {
  const open = useOpenSheet();
  const categories = useCategories();
  const currency = useProfile().data?.currency ?? "USD";
  return (
    <Screen refreshing={categories.isRefetching} onRefresh={() => void categories.refetch()}>
      <PageHeader title="التصنيفات" subtitle="اللون والأيقونة وميزانية كل تصنيف" addLabel="تصنيف جديد" onAdd={() => open("category")} />
      <QueryView query={categories}>
        {(list) => (
          <Reveal index={1}>
            <Group footer="حذف تصنيف لا يحذف مصاريفه، بل تصبح «غير مصنّف».">
              {list.map(({ id, icon, name, budget, expenseCount }) => (
                <Row
                  key={id}
                  emoji={icon}
                  title={name}
                  subtitle={expenseCount > 0 ? countExpenses(expenseCount) : "بلا مصاريف"}
                  trailing={budget === null ? undefined : formatMoney(budget, currency)}
                  onPress={() => open("category", { id })}
                />
              ))}
            </Group>
          </Reveal>
        )}
      </QueryView>
    </Screen>
  );
}
