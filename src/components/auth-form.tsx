"use client";

import { Loader2Icon } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Reveal } from "@/components/motion/reveal";
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

const input =
  "h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70";

/** One labelled row of the grouped field card. */
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 ps-4">
      <div className="list-row-body flex min-w-0 flex-1 items-center gap-3 pe-4">
        <label htmlFor={htmlFor} className="w-24 shrink-0 text-[16px]">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const isLogin = mode === "login";
  // Next keeps the previous auth screen mounted (hidden), so ids must be unique.
  const uid = useId();
  const ids = { name: `${uid}-name`, email: `${uid}-email`, password: `${uid}-password` };

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
        startTransition(() =>
          setError((error.code && ERRORS[error.code]) || error.message || "حدث خطأ، حاول مجدداً"),
        );
        if (scope.current) {
          animate(scope.current, { x: [0, -12, 10, -6, 4, 0] }, { duration: 0.42 });
        }
        return;
      }
      navigator.vibrate?.(10);
      router.replace(safeNext(searchParams.get("next")));
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Reveal index={1}>
        <h2 className="mb-3 px-4 text-[13px] font-medium text-muted-foreground">
          {isLogin ? "سجّل دخولك للمتابعة" : "أنشئ حسابك المجاني في ثوانٍ"}
        </h2>
        <div ref={scope} className="surface inset-list overflow-hidden">
          {!isLogin && (
            <Field label="الاسم" htmlFor={ids.name}>
              <input
                id={ids.name}
                name="name"
                required
                maxLength={50}
                autoComplete="name"
                placeholder="مثال: أحمد"
                className={input}
              />
            </Field>
          )}
          <Field label="البريد" htmlFor={ids.email}>
            <input
              id={ids.email}
              name="email"
              type="email"
              dir="ltr"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              className={`${input} text-left`}
            />
          </Field>
          <Field label="كلمة المرور" htmlFor={ids.password}>
            <input
              id={ids.password}
              name="password"
              type="password"
              dir="ltr"
              required
              minLength={8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "••••••••" : "8 أحرف على الأقل"}
              className={`${input} text-left`}
            />
          </Field>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 px-4 text-[13px] font-medium text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </Reveal>

      <Reveal index={2} className="space-y-4 pt-2">
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 520, damping: 30 }}
          className="tint-button flex h-[52px] w-full items-center justify-center gap-2 text-[17px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
        >
          {pending && <Loader2Icon className="size-5 animate-spin" />}
          {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
        </motion.button>

        <p className="text-center text-[15px] text-muted-foreground">
          {isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-semibold text-primary active:opacity-60"
          >
            {isLogin ? "أنشئ حساباً مجانياً" : "سجّل الدخول"}
          </Link>
        </p>
      </Reveal>
    </form>
  );
}
