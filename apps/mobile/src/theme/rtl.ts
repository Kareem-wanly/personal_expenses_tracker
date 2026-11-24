import { I18nManager, Platform } from "react-native";

/** The app is Arabic only, whatever the language of the phone. */
export function forceRightToLeft() {
  if (Platform.OS === "web") {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    return;
  }
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
