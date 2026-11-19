"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ThemeProvider } from "next-themes";

import { InstallBanner } from "@/components/install-banner";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <DirectionProvider direction="rtl">
          {children}
          <InstallBanner />
          <Toaster position="top-center" richColors closeButton dir="rtl" />
        </DirectionProvider>
      </ThemeProvider>
    </SerwistProvider>
  );
}
