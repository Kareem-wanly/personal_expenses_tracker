"use client";

import { DownloadIcon, ShareIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const noop = () => () => {};

/** Shows a native install button (Android/desktop) or iOS instructions. */
export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!mounted) return null;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (standalone) {
    return <p className="text-sm text-muted-foreground">✅ التطبيق مثبّت على جهازك.</p>;
  }
  if (deferred) {
    return (
      <Button
        className="h-11 w-full"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
      >
        <DownloadIcon />
        تثبيت التطبيق على الجهاز
      </Button>
    );
  }
  if (ios) {
    return (
      <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        في Safari اضغط <ShareIcon className="inline size-4" /> ثم «إضافة إلى الشاشة الرئيسية».
      </p>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
    </p>
  );
}
