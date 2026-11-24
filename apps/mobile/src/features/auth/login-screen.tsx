import { useRouter } from "expo-router";
import { useState } from "react";

import { authClient } from "@/api/auth";
import { Button } from "@/ui/button";

import { AuthPage } from "./auth-page";
import { EmailField, PasswordField } from "./email-field";
import { useAuthAction } from "./use-auth-action";

export function LoginScreen() {
  const router = useRouter();
  const { busy, error, run } = useAuthAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signIn = () => run(() => authClient.signIn.email({ email: email.trim(), password }));

  return (
    <AuthPage title="مصروفي" hint="سجّل دخولك للمتابعة" error={error}>
      <EmailField value={email} onChangeText={setEmail} />
      <PasswordField value={password} onChangeText={setPassword} onSubmitEditing={signIn} />
      <Button label="تسجيل الدخول" onPress={signIn} busy={busy} disabled={!email || !password} />
      <Button label="نسيت كلمة المرور؟" kind="plain" onPress={() => router.push("/forgot")} />
      <Button label="إنشاء حساب جديد" kind="plain" onPress={() => router.push("/register")} />
    </AuthPage>
  );
}
