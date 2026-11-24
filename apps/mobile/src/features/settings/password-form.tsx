import { useState } from "react";

import { authClient } from "@/api/auth";
import { PasswordField } from "@/features/auth/email-field";
import { useAuthAction } from "@/features/auth/use-auth-action";
import { FormLayout } from "@/features/entry/form-layout";
import type { SheetProps } from "@/features/sheets/registry";
import { haptics } from "@/motion/haptics";
import { Button } from "@/ui/button";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";
import { showToast } from "@/ui/toast-store";

export function PasswordForm({ close }: SheetProps) {
  const { busy, error, run } = useAuthAction();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");

  async function submit() {
    const change = { currentPassword, newPassword, revokeOtherSessions: true };
    if (!(await run(() => authClient.changePassword(change)))) return haptics.error();
    haptics.success();
    showToast("تم تغيير كلمة المرور");
    close();
  }

  return (
    <>
      <SheetHeader title="تغيير كلمة المرور" onClose={close} />
      <FormLayout
        footer={
          <>
            {error ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
            <Button label="حفظ" onPress={() => void submit()} busy={busy} disabled={!currentPassword || newPassword.length < 8} />
          </>
        }
      >
        <PasswordField label="كلمة المرور الحالية" value={currentPassword} onChangeText={setCurrent} />
        <PasswordField label="الجديدة (8 أحرف على الأقل)" isNew value={newPassword} onChangeText={setNew} />
        <Text variant="small" color="muted">سيُسجَّل الخروج من أجهزتك الأخرى.</Text>
      </FormLayout>
    </>
  );
}
