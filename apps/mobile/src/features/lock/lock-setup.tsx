import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useProfile } from "@/api/queries";
import type { SheetProps } from "@/features/sheets/registry";
import { haptics } from "@/motion/haptics";
import { Swap } from "@/motion/swap";
import { SheetHeader } from "@/ui/sheet-header";
import { showToast } from "@/ui/toast-store";
import { spacing } from "@/theme/theme";

import { lockStore, markActive, saveLock } from "./lock-store";
import { hashPin } from "./pin";
import { PinPad } from "./pin-pad";
import { useBiometrics } from "./use-biometrics";

/** Choose a PIN, twice. */
export function LockSetup({ close }: SheetProps) {
  const userId = useProfile().data?.id;
  const biometrics = useBiometrics();
  const [first, setFirst] = useState("");
  const [mismatch, setMismatch] = useState(false);

  async function complete(pin: string): Promise<boolean> {
    if (!first) {
      setFirst(pin);
      return true;
    }
    if (pin !== first) {
      setFirst("");
      setMismatch(true);
      return false;
    }
    if (!userId) return false;
    const current = lockStore.get().config;
    const timeout = current?.timeout ?? 60;
    saveLock({ userId, ...(await hashPin(pin)), timeout, biometric: current?.biometric ?? biometrics.available });
    markActive();
    haptics.success();
    showToast("تم تفعيل قفل التطبيق");
    close();
    return true;
  }

  return (
    <>
      <SheetHeader title="رمز القفل" onClose={close} />
      <View style={styles.body}>
        <Swap id={first ? "repeat" : "choose"}>
          <PinPad
            message={first ? "أعد كتابة الرمز" : "اختر رمزاً من 4 أرقام"}
            error={mismatch && !first ? "الرمزان مختلفان، حاول من جديد" : undefined}
            onComplete={complete}
          />
        </Swap>
      </View>
    </>
  );
}

const styles = StyleSheet.create({ body: { paddingBottom: spacing.xxl * 1.5 } });
