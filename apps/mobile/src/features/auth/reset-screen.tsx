import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { authClient } from "@/api/auth";
import { Button } from "@/ui/button";

import { AuthPage } from "./auth-page";
import { authMessage } from "./auth-messages";
import { PasswordField } from "./email-field";
import { useAuthAction } from "./use-auth-action";

/** Opened by the link in the mail, which carries a one-time token. */
export function ResetScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { busy, error, run } = useAuthAction();
  const [newPassword, setNewPassword] = useState("");
  const missingToken = token ? undefined : authMessage({ code: "INVALID_TOKEN" });

  async function reset() {
    if (await run(() => authClient.resetPassword({ newPassword, token }))) router.replace("/login");
  }

  return (
    <AuthPage title="كلمة مرور جديدة" hint="8 أحرف على الأقل" error={error ?? missingToken}>
      <PasswordField isNew value={newPassword} onChangeText={setNewPassword} />
      <Button label="حفظ" onPress={reset} busy={busy} disabled={!token || newPassword.length < 8} />
      <Button label="تسجيل الدخول" kind="plain" onPress={() => router.replace("/login")} />
    </AuthPage>
  );
}
