import type { Metadata } from "next";
import { Suspense, ViewTransition } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "إنشاء حساب" };

export default function RegisterPage() {
  return (
    // Login ↔ register crossfade with a soft rise (see .reveal-* in globals.css).
    <ViewTransition enter="reveal-in" exit="reveal-out" default="none">
      <div>
        {/* useSearchParams needs a Suspense boundary for static prerendering. */}
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </ViewTransition>
  );
}
