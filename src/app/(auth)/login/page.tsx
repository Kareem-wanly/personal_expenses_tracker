import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold">أهلاً بعودتك 👋</h2>
      {/* useSearchParams needs a Suspense boundary for static prerendering. */}
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </>
  );
}
