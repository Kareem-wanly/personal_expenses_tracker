"use client";

import { BellRingIcon, Loader2Icon, XIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
        toast.success("رائع! ستصلك التنبيهات المهمة فقط 🔔");
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
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <button
        type="button"
        onClick={snooze}
        aria-label="إغلاق"
        className="absolute end-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
      >
        <XIcon className="size-4" />
      </button>

      <div className="flex gap-3 pe-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BellRingIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="notify-prompt-title" className="font-semibold">
            خلّيك على اطلاع بميزانيتك
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            ننبّهك عند الوصول إلى 80% من ميزانيتك، ونذكّرك مساءً إذا نسيت تسجيل
            مصاريفك. بدون إزعاج.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button className="h-10 flex-1" onClick={enable} disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <BellRingIcon />}
          فعّل التنبيهات
        </Button>
        <Button variant="ghost" className="h-10" onClick={snooze} disabled={pending}>
          لاحقاً
        </Button>
      </div>
    </section>
  );
}
