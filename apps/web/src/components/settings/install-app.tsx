"use client";

import { CheckIcon, DownloadIcon, ShareIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";

import { Group, Row, RowAnchor, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { ANDROID_APK_URL } from "@/lib/site";
import { promptInstall, useInstallPrompt } from "@/lib/install-prompt";

/**
 * Native install row (Android/desktop), or how to add it on iOS. Android
 * also gets our APK, for people who prefer a "real" app from a file.
 */
export function InstallApp() {
  const { mounted, installed, canPrompt, ios, android } = useInstallPrompt();

  if (!mounted) return null;

  if (installed) {
    return (
      <Group header="التطبيق">
        <Row
          leading={<RowIcon icon={SmartphoneIcon} />}
          title="مثبّت على هذا الجهاز"
          trailing={<CheckIcon className="size-5 text-primary" strokeWidth={2.6} />}
        />
      </Group>
    );
  }

  const apk = android && (
    <RowAnchor
      href={ANDROID_APK_URL}
      download="masrufi.apk"
      leading={<RowIcon icon={DownloadIcon} />}
      title="تحميل تطبيق أندرويد (APK)"
      subtitle="ملف صغير (حوالي ١ ميغا)"
      chevron
    />
  );
  const apkFooter =
    "عند فتح الملف قد يطلب أندرويد السماح بالتثبيت من هذا المصدر، أو ينبّهك Play Protect لأن التطبيق ليس من المتجر. هذا طبيعي.";

  if (canPrompt) {
    return (
      <Group
        header="التطبيق"
        footer={android ? apkFooter : "يفتح بشاشة كاملة مثل أي تطبيق، ويعمل بدون إنترنت."}
      >
        <RowButton
          onClick={async () => {
            if (await promptInstall()) toast.success("تم تثبيت التطبيق");
          }}
          className="text-primary"
          leading={<RowIcon icon={SmartphoneIcon} />}
          title="تثبيت التطبيق على الجهاز"
        />
        {apk}
      </Group>
    );
  }

  return (
    <Group
      header="التطبيق"
      footer={
        ios ? (
          <span className="inline-flex flex-wrap items-center gap-1">
            في Safari اضغط <ShareIcon className="inline size-3.5" /> ثم «إضافة إلى الشاشة الرئيسية».
          </span>
        ) : android ? (
          apkFooter
        ) : (
          "افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."
        )
      }
    >
      {apk || <Row leading={<RowIcon icon={SmartphoneIcon} />} title="ثبّت التطبيق على شاشتك الرئيسية" />}
    </Group>
  );
}
