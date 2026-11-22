"use client";

import { CheckIcon, DownloadIcon, ShareIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";

import { Group, Row, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { promptInstall, useInstallPrompt } from "@/lib/install-prompt";

/** Native install row (Android/desktop), or how to add it on iOS. */
export function InstallApp() {
  const { mounted, installed, canPrompt, ios } = useInstallPrompt();

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

  if (canPrompt) {
    return (
      <Group header="التطبيق" footer="يفتح بشاشة كاملة مثل أي تطبيق، ويعمل بدون إنترنت.">
        <RowButton
          onClick={async () => {
            if (await promptInstall()) toast.success("تم تثبيت التطبيق");
          }}
          className="text-primary"
          leading={<RowIcon icon={DownloadIcon} />}
          title="تثبيت التطبيق على الجهاز"
        />
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
        ) : (
          "افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."
        )
      }
    >
      <Row leading={<RowIcon icon={SmartphoneIcon} />} title="ثبّت التطبيق على شاشتك الرئيسية" />
    </Group>
  );
}
