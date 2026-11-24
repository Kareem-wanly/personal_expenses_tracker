import { useRouter } from "expo-router";
import { useState } from "react";

import { authClient } from "@/api/auth";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";

import { AuthPage } from "./auth-page";
import { EmailField, PasswordField } from "./email-field";
import { useAuthAction } from "./use-auth-action";

export function RegisterScreen() {
  const router = useRouter();
  const { busy, error, run } = useAuthAction();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const complete = name.trim() && email && password.length >= 8;
  const signUp = () =>
    run(() => authClient.signUp.email({ name: name.trim(), email: email.trim(), password }));

  return (
    <AuthPage title="حساب جديد" hint="بياناتك لك وحدك" error={error}>
      <Field label="الاسم" value={name} onChangeText={setName} autoComplete="name" maxLength={50} />
      <EmailField value={email} onChangeText={setEmail} />
      <PasswordField label="كلمة المرور (8 أحرف على الأقل)" isNew value={password} onChangeText={setPassword} />
      <Button label="إنشاء الحساب" onPress={signUp} busy={busy} disabled={!complete} />
      <Button label="لديّ حساب" kind="plain" onPress={() => router.back()} />
    </AuthPage>
  );
}
