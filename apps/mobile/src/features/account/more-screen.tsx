import { authClient } from "@/api/auth";
import { useProfile } from "@/api/queries";
import { Reveal } from "@/motion/reveal";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { QueryView } from "@/ui/query-view";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

/** Settings, debts and goals arrive here in the next phase. */
export function MoreScreen() {
  const profile = useProfile();
  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">المزيد</Text>
      <QueryView query={profile}>
        {(me) => (
          <Reveal>
            <Card>
            <Text variant="heading">{me.name}</Text>
            <Text color="muted">{me.email}</Text>
            <Text color="muted">العملة: {me.currency}</Text>
            </Card>
          </Reveal>
        )}
      </QueryView>
      <Button label="تسجيل الخروج" kind="danger" onPress={() => void authClient.signOut()} />
    </Screen>
  );
}
