import { LOCK_TIMEOUTS, type LockTimeout } from "@masrufi/core/app-lock";

import { lockStore, removeLock, saveLock } from "@/features/lock/lock-store";
import { useBiometrics } from "@/features/lock/use-biometrics";
import { useOpenSheet } from "@/features/sheets/open-sheet";
import { Collapse } from "@/motion/collapse";
import { Group, Row } from "@/ui/group";
import { Segmented } from "@/ui/segmented";
import { Toggle } from "@/ui/toggle";
import { showToast } from "@/ui/toast-store";

const TIMEOUT_LABELS: Record<LockTimeout, string> = { 0: "فوراً", 60: "دقيقة", 300: "5 دقائق", 900: "15 دقيقة" };
const TIMEOUT_OPTIONS = LOCK_TIMEOUTS.map((value) => ({ value: String(value), label: TIMEOUT_LABELS[value] }));

export function SecurityGroup({ userId }: { userId: string }) {
  const open = useOpenSheet();
  const biometrics = useBiometrics();
  const { config } = lockStore.use();
  const lock = config?.userId === userId ? config : null;

  function toggleLock(on: boolean) {
    if (on) return open("lock");
    removeLock();
    showToast("تم إيقاف قفل التطبيق");
  }

  return (
    <Group title="الأمان" footer="القفل يحمي التطبيق على هذا الجهاز برمز من 4 أرقام.">
      <Row icon="key" title="تغيير كلمة المرور" onPress={() => open("password")} />
      <Row icon="lock" title="قفل التطبيق" trailing={<Toggle label="قفل التطبيق" value={lock !== null} onChange={toggleLock} />} />
      {lock ? <Row icon="key" title="تغيير الرمز" onPress={() => open("lock")} /> : null}
      {lock && biometrics.available ? (
        <Row
          icon="fingerprint"
          title="الفتح بالبصمة أو Face ID"
          trailing={
            <Toggle label="البصمة" value={lock.biometric} onChange={(biometric) => saveLock({ ...lock, biometric })} />
          }
        />
      ) : null}
      {lock ? (
        <Collapse open>
          <Segmented
            label="متى يُقفل"
            options={TIMEOUT_OPTIONS}
            value={String(lock.timeout)}
            onChange={(value) => saveLock({ ...lock, timeout: Number(value) as LockTimeout })}
          />
        </Collapse>
      ) : null}
    </Group>
  );
}
