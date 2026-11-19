"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "login" | "register";

const ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  USER_ALREADY_EXISTS: "هذا البريد مسجّل مسبقاً، سجّل الدخول بدلاً من ذلك",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "هذا البريد مسجّل مسبقاً",
  PASSWORD_TOO_SHORT: "كلمة المرور قصيرة جداً (8 أحرف على الأقل)",
  INVALID_EMAIL: "البريد الإلكتروني غير صالح",
};

/** Only allow same-origin relative redirects (prevents open redirects). */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isLogin = mode === "login";

  function onSubmit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    startTransition(async () => {
      const { error } = isLogin
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name });

      if (error) {
        setError(
          (error.code && ERRORS[error.code]) ||
            error.message ||
            "حدث خطأ، حاول مجدداً",
        );
        return;
      }
      router.replace(safeNext(searchParams.get("next")));
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4" noValidate={false}>
      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="name">الاسم</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={50}
            autoComplete="name"
            className="h-11"
            placeholder="مثال: أحمد"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          required
          autoComplete="email"
          inputMode="email"
          className="h-11 text-start"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="h-11 text-start"
          placeholder="••••••••"
        />
        {!isLogin && (
          <p className="text-xs text-muted-foreground">8 أحرف على الأقل</p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {isLogin ? "أنشئ حساباً مجانياً" : "سجّل الدخول"}
        </Link>
      </p>
    </form>
  );
}
