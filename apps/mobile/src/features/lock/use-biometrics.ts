import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

async function isAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
}

/** Fingerprint or Face ID of the phone. */
export function useBiometrics() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    isAvailable().then(setAvailable, () => setAvailable(false));
  }, []);

  async function ask(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "افتح مصروفي",
      cancelLabel: "إلغاء",
      disableDeviceFallback: true,
    }).catch(() => ({ success: false }));
    return result.success;
  }

  return { available, ask };
}
