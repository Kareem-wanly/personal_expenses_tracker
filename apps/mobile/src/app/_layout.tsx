import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authClient } from "@/api/auth";
import { queryClient } from "@/api/query-client";
import { forceRightToLeft } from "@/theme/rtl";
import { useColors } from "@/theme/theme";
import { useAppFonts } from "@/theme/use-app-fonts";

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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle }}>
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="entry" options={{ presentation: "modal" }} />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
