import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";

import { authClient } from "@/api/auth";
import { Button } from "@/ui/button";

import { AuthPage } from "./auth-page";
import { EmailField } from "./email-field";
import { useAuthAction } from "./use-auth-action";

export function ForgotScreen() {
  const router = useRouter();
  const { busy, error, run } = useAuthAction();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function send() {
    const redirectTo = Linking.createURL("/reset");
    setSent(await run(() => authClient.requestPasswordReset({ email: email.trim(), redirectTo })));
  }

  const hint = sent
    ? "إن كان البريد مسجّلاً عندنا فستصلك رسالة فيها رابط."
    : "اكتب بريدك لنرسل لك رابط تعيين كلمة مرور جديدة.";
  return (
    <AuthPage title="استرجاع كلمة المرور" hint={hint} error={error}>
      {sent ? null : <EmailField value={email} onChangeText={setEmail} />}
      {sent ? null : <Button label="إرسال الرابط" onPress={send} busy={busy} disabled={!email} />}
      <Button label="رجوع" kind="plain" onPress={() => router.back()} />
    </AuthPage>
  );
}
