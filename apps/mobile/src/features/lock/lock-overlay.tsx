import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { MAX_ATTEMPTS, failedAttempt } from "@masrufi/core/app-lock";

import { authClient } from "@/api/auth";
import { storage } from "@/lib/storage";
import { PressableScale } from "@/motion/pressable-scale";
import { durations, springs } from "@/motion/tokens";
import { radius, spacing, useColors } from "@/theme/theme";
import { Button } from "@/ui/button";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

import { type LockConfig, lockStore, removeLock, unlock } from "./lock-store";
import { verifyPin } from "./pin";
import { PinPad } from "./pin-pad";
import { useBiometrics } from "./use-biometrics";
import { useLockWatcher } from "./use-lock-watcher";

const ATTEMPTS_KEY = "app-lock-attempts";
const NO_ATTEMPTS = { count: 0, until: 0 };

/** Covers the app while it is locked. `userId`: who is signed in. */
export function LockOverlay({ userId }: { userId: string }) {
  useLockWatcher();
  const { config, locked } = lockStore.use();
  if (!locked || config?.userId !== userId) return null;
  return <LockScreen config={config} />;
}

function readAttempts(): typeof NO_ATTEMPTS {
  return JSON.parse(storage.get(ATTEMPTS_KEY) ?? "null") ?? NO_ATTEMPTS;
}

/** Restarting the app doesn't reset the count. */
function useAttempts() {
  const [attempts, setAttempts] = useState(readAttempts);
  const [now, setNow] = useState(Date.now);
  const waiting = attempts.until > now;

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [waiting]);

  function record(next: typeof NO_ATTEMPTS) {
    storage.set(ATTEMPTS_KEY, JSON.stringify(next));
    setAttempts(next);
    setNow(Date.now());
  }
  return { waiting, seconds: Math.ceil((attempts.until - now) / 1000), attempts, record };
}

function LockScreen({ config }: { config: LockConfig }) {
  const colors = useColors();
  const biometrics = useBiometrics();
  const { waiting, seconds, attempts, record } = useAttempts();
  const canUseBiometrics = config.biometric && biometrics.available;
  const offered = useRef(false);

  async function tryBiometrics() {
    if (await biometrics.ask()) {
      record(NO_ATTEMPTS);
      unlock();
    }
  }

  // Offered right away, once.
  useEffect(() => {
    if (!canUseBiometrics || offered.current) return;
    offered.current = true;
    void tryBiometrics();
  });

  async function check(pin: string): Promise<boolean> {
    const right = await verifyPin(pin, config);
    record(right ? NO_ATTEMPTS : failedAttempt(attempts, Date.now()));
    if (right) unlock();
    return right;
  }

  /** The password is the way back in. */
  async function forgot() {
    await authClient.signOut();
    record(NO_ATTEMPTS);
    removeLock();
  }

  const error = waiting
    ? `محاولات كثيرة، انتظر ${seconds} ث`
    : attempts.count > 0
      ? `رمز غير صحيح، بقي لك ${MAX_ATTEMPTS - attempts.count}`
      : undefined;

  return (
    <Animated.View exiting={FadeOut.duration(durations.normal)} style={[StyleSheet.absoluteFill, styles.screen, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={ZoomIn.springify().stiffness(springs.pop.stiffness).damping(springs.pop.damping)}
        style={[styles.badge, { backgroundColor: colors.ink }]}
      >
        <Icon name="lock" color={colors.onInk} />
      </Animated.View>
      <Text variant="heading">مصروفي</Text>
      <PinPad
        message={canUseBiometrics ? "أدخل الرمز أو استخدم البصمة" : "أدخل رمز القفل"}
        error={error}
        disabled={waiting}
        onComplete={check}
        extraKey={
          canUseBiometrics ? (
            <PressableScale accessibilityRole="button" accessibilityLabel="البصمة" onPress={() => void tryBiometrics()}>
              <Icon name="fingerprint" color={colors.accent} size={34} />
            </PressableScale>
          ) : null
        }
      />
      <View>
        <Button label="نسيت الرمز؟ ادخل بكلمة المرور" kind="plain" onPress={() => void forgot()} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  badge: { width: 60, height: 60, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
});
