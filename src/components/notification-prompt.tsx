"use client";

import { BellRingIcon, Loader2Icon, XIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { useInstallPrompt } from "@/lib/install-prompt";
import { VAPID_PUBLIC_KEY, enablePush, usePushState, useSnooze } from "@/lib/push-client";

/**
 * "Soft ask" before the browser's permission dialog: explain the value first,
 * and only call Notification.requestPermission() when the user taps the
 * button (a user gesture — required on iOS, and avoids Chrome's quiet UI).
 *
 * Shown only when it can succeed and the timing makes sense: the user already
 * logged an expense or runs the installed app, permission was never decided,
 * and they didn't snooze it in the last 7 days.
 */
export function NotificationPrompt({ hasExpenses }: { hasExpenses: boolean }) {
  const { support, permission, subscription, setPermission, setSubscription } =
    usePushState();
  const { installed } = useInstallPrompt();
  const { snoozed, snooze } = useSnooze("notify-prompt-snoozed-at", 7);
  const [pending, startTransition] = useTransition();

  const visible =
    support === "supported" &&
    !!VAPID_PUBLIC_KEY &&
    permission === "default" &&
    !subscription &&
    !snoozed &&
    (hasExpenses || installed);

  if (!visible) return null;

  function enable() {
    startTransition(async () => {
      const res = await enablePush();
      if (res.ok) {
        setSubscription(res.subscription);
        setPermission("granted");
        toast.success("تم تفعيل التنبيهات. سنرسل المهم فقط.");
      } else {
        if (res.permission) setPermission(res.permission);
        // "Not now" in the browser dialog: back off like a snooze.
        if (res.permission === "default") snooze();
        toast.error(res.message);
      }
    });
  }

  return (
    <section
      aria-labelledby="notify-prompt-title"
      className="surface relative overflow-hidden p-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <button
        type="button"
        onClick={snooze}
        aria-label="إغلاق"
        className="absolute end-3 top-3 flex size-7 items-center justify-center rounded-full bg-foreground/[0.07] text-muted-foreground"
      >
        <XIcon className="size-4" />
      </button>

      <div className="flex gap-3 pe-6">
        <BellRingIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-foreground/70" strokeWidth={1.75} />
        <div className="min-w-0">
          <h2 id="notify-prompt-title" className="text-[16px] font-semibold">
            تنبيهات الميزانية
          </h2>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            نخبرك عند الوصول إلى 80% من ميزانيتك، ونذكّرك مساءً إذا لم تسجّل
            مصاريف اليوم. لا شيء غير ذلك.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={enable}
          disabled={pending}
          className="tint-button flex h-11 flex-1 items-center justify-center gap-1.5 text-[15px] font-semibold active:scale-[0.97] disabled:opacity-70"
        >
          {pending ? <Loader2Icon className="size-[18px] animate-spin" /> : <BellRingIcon className="size-[18px]" />}
          فعّل التنبيهات
        </button>
        <button
          type="button"
          onClick={snooze}
          disabled={pending}
          className="h-11 px-4 text-[15px] font-medium text-muted-foreground active:opacity-60"
        >
          لاحقاً
        </button>
      </div>
    </section>
  );
}
