import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "إنشاء حساب" };

export default function RegisterPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold">ابدأ بتتبّع مصاريفك ✨</h2>
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </>
  );
}
