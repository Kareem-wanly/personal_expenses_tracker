"use client";

import { FingerprintIcon, KeyRoundIcon, LockIcon } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { LockSurface, PinPad } from "@/components/app-lock/pin-pad";
import { Group, Row, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import {
  LOCK_KEY,
  LOCK_TIMEOUTS,
  type LockConfig,
  type LockTimeout,
  biometricsSupported,
  hashPin,
  markActive,
  readLock,
  subscribeLock,
  verifyBiometric,
  writeLock,
} from "@/lib/app-lock";

const TIMEOUT_LABELS: Record<LockTimeout, string> = { 0: "فوراً", 60: "1 د", 300: "5 د", 900: "15 د" };
const DEFAULT_TIMEOUT: LockTimeout = 300;

const noop = () => () => {};
const rawLock = () => {
  try {
    return localStorage.getItem(LOCK_KEY);
  } catch {
    return null;
  }
};

/**
 * Settings for the on-device app lock: on/off, how long before it locks,
 * Face ID / fingerprint (via one of the user's passkeys) and changing the PIN.
 */
export function AppLockSettings({
  userId,
  passkeyIds,
}: {
  userId: string;
  /** Credential IDs of the user's passkeys; null while loading. */
  passkeyIds: string[] | null;
}) {
  const raw = useSyncExternalStore(subscribeLock, rawLock, () => null);
  const supported = useSyncExternalStore(noop, biometricsSupported, () => false);
  // Re-parse only when the stored value changes (keeps the snapshot stable).
  const cfg = useMemo(() => (raw ? readLock() : null), [raw]);
  const mine = cfg && cfg.userId === userId ? cfg : null;
  const [setup, setSetup] = useState<null | "enable" | "change">(null);

  const update = (patch: Partial<LockConfig>) => mine && writeLock({ ...mine, ...patch });

  async function savePin(pin: string) {
    const { salt, hash } = await hashPin(pin);
    writeLock({
      v: 1,
      userId,
      salt,
      hash,
      timeout: mine?.timeout ?? DEFAULT_TIMEOUT,
      credentialId: mine?.credentialId ?? null,
    });
    markActive();
    toast.success(setup === "change" ? "تم تغيير الرمز" : "تم تفعيل قفل التطبيق");
    setSetup(null);
  }

  async function toggleBiometric(on: boolean) {
    if (!on) return update({ credentialId: null });
    const used = await verifyBiometric(passkeyIds ?? []);
    if (!used) return toast.error("لم يتم التحقق");
    update({ credentialId: used });
    toast.success("سيُفتح التطبيق بالبصمة أو Face ID");
  }

  const noPasskey = !passkeyIds?.length;

  return (
    <>
      <Group
        header="قفل التطبيق"
        footer="يبقى القفل على هذا الجهاز فقط. إن نسيت الرمز تدخل بكلمة المرور من جديد."
      >
        <Row
          leading={<RowIcon icon={LockIcon} />}
          title="قفل التطبيق"
          subtitle={mine ? undefined : "اطلب رمزاً عند العودة إلى التطبيق"}
          trailing={
            <Switch
              aria-label="قفل التطبيق"
              checked={!!mine}
              onCheckedChange={(on) => (on ? setSetup("enable") : writeLock(null))}
            />
          }
        />
        {mine && (
          <>
            <Row
              title="يُقفل بعد"
              trailing={
                <SegmentedControl
                  label="يُقفل بعد"
                  className="w-52 shrink-0"
                  value={String(mine.timeout)}
                  options={LOCK_TIMEOUTS.map((t) => ({ value: String(t), label: TIMEOUT_LABELS[t] }))}
                  onChange={(v) => update({ timeout: Number(v) as LockTimeout })}
                />
              }
            />
            {supported && (
              <Row
                leading={<RowIcon icon={FingerprintIcon} />}
                title="الفتح بالبصمة أو Face ID"
                subtitle={noPasskey && !mine.credentialId ? "فعّل الدخول بالبصمة في «الأمان» أولاً" : undefined}
                trailing={
                  <Switch
                    aria-label="الفتح بالبصمة أو Face ID"
                    checked={!!mine.credentialId}
                    disabled={noPasskey && !mine.credentialId}
                    onCheckedChange={toggleBiometric}
                  />
                }
              />
            )}
            <RowButton
              leading={<RowIcon icon={KeyRoundIcon} />}
              title="تغيير الرمز"
              chevron
              onClick={() => setSetup("change")}
            />
          </>
        )}
      </Group>
      {setup && <SetupPin onDone={savePin} onCancel={() => setSetup(null)} />}
    </>
  );
}

/** Choose + confirm a new PIN, full screen like the lock itself. */
function SetupPin({ onDone, onCancel }: { onDone: (pin: string) => Promise<void>; onCancel: () => void }) {
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function complete(pin: string) {
    if (!first) {
      setFirst(pin);
      setError(null);
      return true;
    }
    if (pin !== first) {
      setFirst(null);
      setError("الرمزان غير متطابقين — حاول من جديد");
      return false;
    }
    await onDone(pin);
    return true;
  }

  return createPortal(
    <LockSurface
      footer={
        <button type="button" onClick={onCancel} className="text-[15px] font-medium text-primary">
          إلغاء
        </button>
      }
    >
      <PinPad
        key={first ? "confirm" : "choose"}
        title={first ? "أكّد الرمز" : "اختر رمزاً من 4 أرقام"}
        message={first ? "أدخل الرمز نفسه مرة أخرى" : "ستستخدمه لفتح التطبيق على هذا الجهاز"}
        error={first ? undefined : error}
        onComplete={complete}
      />
    </LockSurface>,
    document.body,
  );
}
