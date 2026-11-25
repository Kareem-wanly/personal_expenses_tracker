import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authClient } from "@/api/auth";
import { queryClient } from "@/api/query-client";
import { EntryMenuHost } from "@/features/entry-menu/entry-menu-host";
import { LockOverlay, useIsLocked } from "@/features/lock/lock-overlay";
import { SplashOverlay } from "@/features/splash/splash-overlay";
import { forceRightToLeft, rtlRoot } from "@/theme/rtl";
import { useColors, useScheme } from "@/theme/theme";
import { useAppFonts } from "@/theme/use-app-fonts";
import { Overlay } from "@/ui/overlay";
import { ToastHost } from "@/ui/toast-host";

forceRightToLeft();
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colors = useColors();
  const scheme = useScheme();
  const fontsReady = useAppFonts();
  const { data: session, isPending } = authClient.useSession();
  const ready = fontsReady && !isPending;
  // Screen readers must not reach what the lock covers.
  const hidden = useIsLocked(session?.user.id);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // What shows behind sheets and around the app, so it is never light in dark mode.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  // Another account must never see the previous one's data.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) queryClient.clear();
  }, [userId]);

  if (!ready) return null;
  const contentStyle = { backgroundColor: colors.background };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <View {...rtlRoot} style={styles.root}>
            <View
              style={styles.root}
              importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
              accessibilityElementsHidden={hidden}
            >
              <Stack screenOptions={{ headerShown: false, contentStyle, animation: "fade" }}>
                <Stack.Protected guard={!!session}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="entry" options={sheetOptions} />
                  <Stack.Screen name="sheet/[name]" options={sheetOptions} />
                </Stack.Protected>
                <Stack.Protected guard={!session}>
                  <Stack.Screen name="(auth)" />
                </Stack.Protected>
              </Stack>
            </View>
            <Overlay>
              <EntryMenuHost />
              <ToastHost />
              {session ? <LockOverlay userId={session.user.id} /> : null}
              <SplashOverlay />
            </Overlay>
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const transparent = { backgroundColor: "transparent" };

const sheetOptions = {
  // Inside the app's own layer, so the system bars and the page underneath stay ours.
  presentation: "containedTransparentModal",
  animation: "none",
  contentStyle: transparent,
} as const;

const styles = StyleSheet.create({ root: { flex: 1 } });
