import { Stack } from "expo-router";

import { useColors } from "@/theme/theme";

export default function AuthLayout() {
  const { background } = useColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_left", contentStyle: { backgroundColor: background } }}
    />
  );
}
