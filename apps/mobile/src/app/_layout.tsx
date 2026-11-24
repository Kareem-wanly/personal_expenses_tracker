import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authClient } from "@/api/auth";
import { queryClient } from "@/api/query-client";
import { EntryMenuHost } from "@/features/entry-menu/entry-menu-host";
import { SplashOverlay } from "@/features/splash/splash-overlay";
import { forceRightToLeft, rtlRoot } from "@/theme/rtl";
import { useColors } from "@/theme/theme";
import { useAppFonts } from "@/theme/use-app-fonts";
import { ToastHost } from "@/ui/toast-host";

forceRightToLeft();
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colors = useColors();
  const fontsReady = useAppFonts();
  const { data: session, isPending } = authClient.useSession();
  const ready = fontsReady && !isPending;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

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
          <StatusBar style="auto" />
          <View {...rtlRoot} style={styles.root}>
            <Stack screenOptions={{ headerShown: false, contentStyle, animation: "fade" }}>
              <Stack.Protected guard={!!session}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="entry"
                  options={{
                    presentation: "transparentModal",
                    animation: "none",
                    contentStyle: styles.transparent,
                  }}
                />
              </Stack.Protected>
              <Stack.Protected guard={!session}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
            </Stack>
            <EntryMenuHost />
            <ToastHost />
            <SplashOverlay />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, transparent: { backgroundColor: "transparent" } });
