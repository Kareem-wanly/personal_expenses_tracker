import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import type { Profile } from "@masrufi/contracts/api/responses";
import { formatMoney } from "@masrufi/core/money";

import { authClient } from "@/api/auth";
import { useCategories, useProfile } from "@/api/queries";
import { RecurringGroup } from "@/features/recurring/recurring-group";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import { Reveal } from "@/motion/reveal";
import { radius, spacing, useColors } from "@/theme/theme";
import { Card } from "@/ui/card";
import { Group, Row } from "@/ui/group";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import { DataGroup } from "./data-group";
import { NotificationGroup } from "./notification-group";
import { SecurityGroup } from "./security-group";
import { ThemeGroup } from "./theme-group";

export function SettingsScreen() {
  const profile = useProfile();
  return (
    <Screen refreshing={profile.isRefetching} onRefresh={() => void profile.refetch()}>
      <Text variant="title" accessibilityRole="header">الإعدادات</Text>
      <QueryView query={profile}>{(me) => <Settings me={me} />}</QueryView>
    </Screen>
  );
}

function Settings({ me }: { me: Profile }) {
  const open = useOpenSheet();
  const groups = [
    <ProfileCard key="profile" me={me} />,
    <PlanGroup key="plan" me={me} />,
    <RecurringGroup key="recurring" currency={me.currency} />,
    <NotificationGroup key="notifications" me={me} />,
    <ThemeGroup key="theme" />,
    <SecurityGroup key="security" userId={me.id} />,
    <DataGroup key="data" />,
    <Group key="leave" footer="حذف الحساب يحذف كل بياناتك نهائياً.">
      <Row icon="logout" title="تسجيل الخروج" color="negative" onPress={() => void authClient.signOut()} />
      <Row icon="trash" title="حذف الحساب" color="negative" onPress={() => open("delete-account")} />
    </Group>,
  ];
  return (
    <>
      {groups.map((group, index) => (
        <Reveal key={group.key} index={index}>{group}</Reveal>
      ))}
    </>
  );
}

function ProfileCard({ me }: { me: Profile }) {
  const colors = useColors();
  return (
    <Card style={styles.profile}>
      <View style={[styles.initial, { backgroundColor: colors.ink }]}>
        <Text variant="title" color="onInk">{me.name.trim().slice(0, 1) || "؟"}</Text>
      </View>
      <View style={styles.texts}>
        <Text variant="heading" numberOfLines={1}>{me.name}</Text>
        <Text variant="small" color="muted" numberOfLines={1}>{me.email}</Text>
      </View>
    </Card>
  );
}

function PlanGroup({ me }: { me: Profile }) {
  const open = useOpenSheet();
  const router = useRouter();
  const categories = useCategories().data;
  const budget = me.monthlyBudget === null ? "غير محددة" : formatMoney(me.monthlyBudget, me.currency);
  return (
    <Group title="الحساب">
      <Row icon="edit" title="الاسم والعملة والميزانية" subtitle={`${me.currency} · الميزانية ${budget}`} onPress={() => open("profile")} />
      <Row icon="tag" title="التصنيفات" trailing={categories ? String(categories.length) : undefined} onPress={() => router.push("/categories")} />
    </Group>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  initial: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  texts: { flex: 1 },
});
