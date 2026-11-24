import { useState } from "react";

import { authClient } from "@/api/auth";
import { PasswordField } from "@/features/auth/email-field";
import { useAuthAction } from "@/features/auth/use-auth-action";
import { FormLayout } from "@/features/entry/form-layout";
import { removeLock } from "@/features/lock/lock-store";
import type { SheetProps } from "@/features/sheets/registry";
import { haptics } from "@/motion/haptics";
import { Button } from "@/ui/button";
import { SheetHeader } from "@/ui/sheet-header";
import { Text } from "@/ui/text";
import { showToast } from "@/ui/toast-store";

export function DeleteAccount({ close }: SheetProps) {
  const { busy, error, run } = useAuthAction();
  const [password, setPassword] = useState("");

  async function confirm() {
    if (!(await run(() => authClient.deleteUser({ password })))) return haptics.error();
    removeLock();
    showToast("تم حذف حسابك وكل بياناتك");
    // The session no longer exists; this also clears it on the phone.
    await authClient.signOut().catch(() => undefined);
  }

  return (
    <>
      <SheetHeader title="حذف الحساب نهائياً؟" onClose={close} />
      <FormLayout
        footer={
          <>
            {error ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
            <Button label="حذف حسابي" kind="danger" onPress={() => void confirm()} busy={busy} disabled={!password} />
          </>
        }
      >
        <Text color="muted">سيُحذف حسابك وكل مصاريفك ودخلك وديونك وأهدافك، ولا يمكن التراجع. نزّل نسخة احتياطية أولاً إن أردت الاحتفاظ بها.</Text>
        <PasswordField value={password} onChangeText={setPassword} />
      </FormLayout>
    </>
  );
}
