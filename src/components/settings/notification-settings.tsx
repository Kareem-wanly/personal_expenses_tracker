"use client";

import {
  BellIcon,
  CalendarClockIcon,
  type LucideIcon,
  Loader2Icon,
  MoonStarIcon,
  RepeatIcon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { Group, Row, RowButton, RowIcon } from "@/components/ui/grouped-list";
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
  notifyRecurring: boolean;
};

const PREF_ITEMS: {
  key: keyof Prefs;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: "notifyBudget",
    icon: TriangleAlertIcon,
    title: "تنبيهات الميزانية",
    description: "عند الوصول إلى 80% من الميزانية وعند تجاوزها.",
  },
  {
    key: "notifyDailyReminder",
    icon: MoonStarIcon,
    title: "تذكير يومي مسائي",
    description: "فقط إذا لم تسجّل أي مصروف في ذلك اليوم.",
  },
  {
    key: "notifyMonthlySummary",
    icon: CalendarClockIcon,
    title: "الملخص الشهري",
    description: "في أول كل شهر: كم صرفت ومقارنة بالشهر السابق.",
  },
  {
    key: "notifyRecurring",
    icon: RepeatIcon,
    title: "المصاريف المتكررة",
    description: "تنبيه مساء اليوم السابق لإضافة اشتراك أو فاتورة متكررة.",
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
    return <div className="h-48 animate-pulse rounded-[22px] bg-foreground/[0.07] dark:bg-white/[0.09]" />;
  }

  const ready = support === "supported" && !!VAPID_PUBLIC_KEY && permission !== "denied";

  return (
    <Group
      header="الإشعارات"
      footer={
        <DeviceHint
          support={support}
          permission={permission}
          configured={!!VAPID_PUBLIC_KEY}
          subscribed={!!subscription}
        />
      }
    >
      {ready && (
        <Row
          leading={<RowIcon icon={BellIcon} />}
          title="هذا الجهاز"
          subtitle={subscription ? "الإشعارات مفعّلة" : "الإشعارات متوقفة"}
          trailing={
            pending ? (
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                checked={!!subscription}
                onCheckedChange={(on) => (on ? enable() : disable())}
                aria-label="الإشعارات على هذا الجهاز"
              />
            )
          }
        />
      )}
      {PREF_ITEMS.map((item) => (
        <Row
          key={item.key}
          leading={<RowIcon icon={item.icon} />}
          title={<label htmlFor={item.key}>{item.title}</label>}
          subtitle={item.description}
          trailing={
            <Switch
              id={item.key}
              aria-label={item.title}
              checked={prefs[item.key]}
              onCheckedChange={(v) => togglePref(item.key, v)}
            />
          }
        />
      ))}
      {subscription && (
        <RowButton
          onClick={test}
          disabled={pending}
          className="text-primary"
          leading={<RowIcon icon={SendIcon} />}
          title="إرسال إشعار تجريبي"
        />
      )}
    </Group>
  );
}

/** Why notifications can't be turned on here, in the group footer. */
function DeviceHint({
  support,
  permission,
  configured,
  subscribed,
}: {
  support: PushSupport;
  permission: NotificationPermission;
  configured: boolean;
  subscribed: boolean;
}) {
  if (support === "ios-needs-install") {
    return (
      <>
        على آيفون: ثبّت التطبيق أولاً (مشاركة ← «إضافة إلى الشاشة الرئيسية») ثم افتحه من
        الأيقونة لتفعيل الإشعارات. يتطلب iOS 16.4 أو أحدث.
      </>
    );
  }
  if (support === "unsupported") return <>هذا المتصفح لا يدعم الإشعارات.</>;
  if (support === "no-sw") return <>الإشعارات متاحة في النسخة المنشورة من التطبيق فقط.</>;
  if (!configured) return <>الإشعارات غير مهيّأة على الخادم بعد (مفاتيح VAPID).</>;
  if (permission === "denied") {
    return (
      <>
        الإشعارات محظورة لهذا الموقع. فعّلها من إعدادات المتصفح (أيقونة القفل بجانب الرابط ←
        الإشعارات ← سماح) ثم أعد فتح الصفحة.
      </>
    );
  }
  return subscribed ? <>تصلك التنبيهات المهمة فقط، بدون إزعاج.</> : null;
}
