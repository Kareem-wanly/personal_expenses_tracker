"use client";

import { FingerprintIcon, KeyRoundIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { GoogleIcon } from "@/components/icons/google-icon";
import { AppLockSettings } from "@/components/settings/app-lock-settings";
import { Group, Row, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { readLock, writeLock } from "@/lib/app-lock";
import { authClient } from "@/lib/auth-client";

type PasskeyItem = { id: string; credentialID: string; name?: string | null; createdAt?: string | Date | null };

const noop = () => () => {};

/** A readable default name for this device's passkey. */
function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  return "هذا الجهاز";
}

const dateFmt = new Intl.DateTimeFormat("ar-u-nu-latn", { day: "numeric", month: "long", year: "numeric" });

/**
 * Passkeys: sign in with Face ID / fingerprint instead of typing the
 * password. Keys live in the device's keychain; the server only stores the
 * public half.
 */
export function SecuritySettings({ userId, google }: { userId: string; google: boolean }) {
  const supported = useSyncExternalStore(noop, () => typeof window.PublicKeyCredential !== "undefined", () => false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [keys, setKeys] = useState<PasskeyItem[] | null>(null);
  const [googleLinked, setGoogleLinked] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const { data } = await authClient.passkey.listUserPasskeys();
    setKeys((data as PasskeyItem[] | null) ?? []);
  }, []);

  useEffect(() => {
    if (!google) return;
    let cancelled = false;
    authClient.listAccounts().then(({ data }) => {
      if (!cancelled) setGoogleLinked(!!data?.some((a) => a.providerId === "google"));
    });
    // Coming back from Google after "link": report the outcome once.
    const params = new URLSearchParams(location.search);
    const linked = params.get("linked");
    const err = params.get("error");
    if (linked || err) {
      if (linked === "google") toast.success("تم ربط حساب Google");
      else if (err) toast.error(err === "email_doesn't_match" ? "بريد Google مختلف عن بريد حسابك" : "تعذّر ربط Google");
      history.replaceState(null, "", location.pathname);
    }
    return () => {
      cancelled = true;
    };
  }, [google]);

  function linkGoogle() {
    startTransition(async () => {
      const { error } = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/settings?linked=google",
        errorCallbackURL: "/settings",
      });
      if (error) toast.error("تعذّر الاتصال بـ Google");
    });
  }

  useEffect(() => {
    let cancelled = false;
    authClient.passkey.listUserPasskeys().then(({ data }) => {
      if (!cancelled) setKeys((data as PasskeyItem[] | null) ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function add() {
    startTransition(async () => {
      const res = await authClient.passkey.addPasskey({ name: deviceName() });
      if (res?.error) {
        const msg = res.error.message ?? "";
        if (!/cancel|abort|not allowed/i.test(msg)) toast.error("تعذّر إضافة مفتاح المرور");
        return;
      }
      toast.success("تمت إضافة مفتاح المرور — يمكنك الآن الدخول بالبصمة");
      await load();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        toast.error("تعذّر الحذف");
        return;
      }
      // The app lock can't use a deleted passkey for Face ID any more.
      const lock = readLock();
      const removed = keys?.find((k) => k.id === id);
      if (lock && removed && lock.credentialId === removed.credentialID) {
        writeLock({ ...lock, credentialId: null });
      }
      toast.success("تم حذف مفتاح المرور");
      await load();
    });
  }

  if (!mounted) return null;

  return (
    <>
      <Group
        header="الأمان"
        footer={
          supported
            ? "مفتاح المرور يحفظه جهازك ويُفتح بالبصمة أو Face ID. لا نخزّن بصمتك؛ يصلنا مفتاح عام فقط."
            : "هذا المتصفح لا يدعم مفاتيح المرور."
        }
      >
        {keys === null ? (
          <Row leading={<RowIcon icon={KeyRoundIcon} />} title={<span className="text-muted-foreground">…</span>} />
        ) : (
          keys.map((k) => (
            <Row
              key={k.id}
              leading={<RowIcon icon={KeyRoundIcon} />}
              title={k.name || "مفتاح مرور"}
              subtitle={k.createdAt ? `أُضيف في ${dateFmt.format(new Date(k.createdAt))}` : undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => remove(k.id)}
                  disabled={pending}
                  aria-label={`حذف ${k.name || "مفتاح المرور"}`}
                  className="flex size-9 items-center justify-center rounded-full text-destructive active:bg-foreground/[0.06] disabled:opacity-50"
                >
                  <Trash2Icon className="size-[18px]" />
                </button>
              }
            />
          ))
        )}
        {google && (
          <Row
            leading={<GoogleIcon className="size-[19px] shrink-0" />}
            title="حساب Google"
            subtitle={googleLinked ? "مرتبط — يمكنك الدخول بـ Google" : "اربطه لتدخل بضغطة واحدة"}
            trailing={
              googleLinked === false ? (
                <button
                  type="button"
                  onClick={linkGoogle}
                  disabled={pending}
                  className="h-8 rounded-full px-3 text-[14px] font-semibold text-primary ring-1 ring-inset ring-hairline active:bg-foreground/[0.06] disabled:opacity-50"
                >
                  ربط
                </button>
              ) : null
            }
          />
        )}
        {supported && (
          <RowButton
            onClick={add}
            disabled={pending}
            className="text-primary"
            leading={<RowIcon icon={keys && keys.length ? PlusIcon : FingerprintIcon} />}
            title={
              <span className="flex items-center gap-2">
                {keys && keys.length ? "إضافة مفتاح لجهاز آخر" : "تفعيل الدخول بالبصمة أو Face ID"}
                {pending && <Loader2Icon className="size-4 animate-spin" />}
              </span>
            }
          />
        )}
      </Group>
      <AppLockSettings userId={userId} passkeyIds={keys ? keys.map((k) => k.credentialID) : null} />
    </>
  );
}
