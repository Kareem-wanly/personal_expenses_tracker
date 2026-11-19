"use client";

import { BellIcon, BellOffIcon, Loader2Icon, SendIcon } from "lucide-react";
import { useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  type PushSupport,
  VAPID_PUBLIC_KEY,
  enablePush,
  usePushState,
} from "@/lib/push-client";
import {
  sendTestNotification,
  unsubscribePush,
  updateNotificationPrefs,
} from "@/server/actions";

type Prefs = {
  notifyBudget: boolean;
  notifyDailyReminder: boolean;
  notifyMonthlySummary: boolean;
};

const PREF_ITEMS: { key: keyof Prefs; title: string; description: string }[] = [
  {
    key: "notifyBudget",
    title: "تنبيهات الميزانية",
    description: "عند الوصول إلى 80% من الميزانية وعند تجاوزها.",
  },
  {
    key: "notifyDailyReminder",
    title: "تذكير يومي مسائي",
    description: "فقط إذا لم تسجّل أي مصروف في ذلك اليوم.",
  },
  {
    key: "notifyMonthlySummary",
    title: "الملخص الشهري",
    description: "في أول كل شهر: كم صرفت ومقارنة بالشهر السابق.",
  },
];

const noop = () => () => {};

export function NotificationSettings({ prefs: initialPrefs }: { prefs: Prefs }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const { support, permission, subscription, setPermission, setSubscription } =
    usePushState();
  const [prefs, setPrefs] = useState(initialPrefs);
  const [pending, startTransition] = useTransition();

  function enable() {
    startTransition(async () => {
      const res = await enablePush();
      if (res.ok) {
        setSubscription(res.subscription);
        setPermission("granted");
        toast.success(res.message);
      } else {
        if (res.permission) setPermission(res.permission);
        toast.error(res.message);
      }
    });
  }

  function disable() {
    if (!subscription) return;
    startTransition(async () => {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => {});
      const res = await unsubscribePush(endpoint);
      setSubscription(null);
      toast.success(res.message);
    });
  }

  function test() {
    startTransition(async () => {
      const res = await sendTestNotification();
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  function togglePref(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      const res = await updateNotificationPrefs(next);
      if (!res.ok) {
        setPrefs(prefs); // roll back the optimistic change
        toast.error(res.message);
      }
    });
  }

  if (!mounted || support === "loading") {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <DeviceStatus
        support={support}
        permission={permission}
        subscribed={!!subscription}
        configured={!!VAPID_PUBLIC_KEY}
        pending={pending}
        onEnable={enable}
        onDisable={disable}
        onTest={test}
      />

      <ul className="divide-y border-t pt-1">
        {PREF_ITEMS.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-4 py-3">
            <label htmlFor={item.key} className="min-w-0 cursor-pointer">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </label>
            <Switch
              id={item.key}
              checked={prefs[item.key]}
              onCheckedChange={(v) => togglePref(item.key, v)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeviceStatus({
  support,
  permission,
  subscribed,
  configured,
  pending,
  onEnable,
  onDisable,
  onTest,
}: {
  support: PushSupport;
  permission: NotificationPermission;
  subscribed: boolean;
  configured: boolean;
  pending: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onTest: () => void;
}) {
  const spinner = pending && <Loader2Icon className="animate-spin" />;

  if (support === "ios-needs-install") {
    return (
      <Hint>
        على آيفون: ثبّت التطبيق أولاً (مشاركة ← «إضافة إلى الشاشة الرئيسية») ثم افتحه
        من الأيقونة لتفعيل الإشعارات. يتطلب iOS 16.4 أو أحدث.
      </Hint>
    );
  }
  if (support === "unsupported") {
    return <Hint>هذا المتصفح لا يدعم الإشعارات.</Hint>;
  }
  if (support === "no-sw") {
    return <Hint>الإشعارات متاحة في النسخة المنشورة من التطبيق فقط.</Hint>;
  }
  if (!configured) {
    return <Hint>الإشعارات غير مهيّأة على الخادم بعد (مفاتيح VAPID).</Hint>;
  }
  if (permission === "denied") {
    return (
      <Hint>
        الإشعارات محظورة لهذا الموقع. فعّلها من إعدادات المتصفح (أيقونة القفل بجانب
        الرابط ← الإشعارات ← سماح) ثم أعد فتح الصفحة.
      </Hint>
    );
  }
  if (subscribed) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <BellIcon className="size-4" />
          الإشعارات مفعّلة على هذا الجهاز
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 flex-1" onClick={onTest} disabled={pending}>
            {spinner || <SendIcon />}
            إشعار تجريبي
          </Button>
          <Button variant="ghost" className="h-10" onClick={onDisable} disabled={pending}>
            <BellOffIcon />
            إيقاف
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Button className="h-11 w-full" onClick={onEnable} disabled={pending}>
      {spinner || <BellIcon />}
      تفعيل الإشعارات على هذا الجهاز
    </Button>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{children}</p>;
}
