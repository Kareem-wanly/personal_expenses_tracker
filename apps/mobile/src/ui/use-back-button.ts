import { useEffect, useEffectEvent } from "react";
import { BackHandler, Platform } from "react-native";

/** Android's back button closes what is open instead of leaving the page. */
export function useBackButton(close: () => void) {
  const onBack = useEffectEvent(() => {
    close();
    return true;
  });
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => onBack());
    return () => subscription.remove();
  }, []);
}
