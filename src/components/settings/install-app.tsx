"use client";

import { DownloadIcon, ShareIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { promptInstall, useInstallPrompt } from "@/lib/install-prompt";

/** Native install button (Android/desktop) or iOS instructions. */
export function InstallApp() {
  const { mounted, installed, canPrompt, ios } = useInstallPrompt();

  if (!mounted) return null;
  if (installed) {
    return <p className="text-sm text-muted-foreground">✅ التطبيق مثبّت على جهازك.</p>;
  }
  if (canPrompt) {
    return (
      <Button
        className="h-11 w-full"
        onClick={async () => {
          if (await promptInstall()) toast.success("تم تثبيت التطبيق 🎉");
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
