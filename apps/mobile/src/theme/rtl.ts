import { I18nManager, Platform } from "react-native";

/** Root props that make `start` mean right in a browser; phones know from I18nManager. */
export const rtlRoot = Platform.OS === "web" ? { dir: "rtl", lang: "ar" } : {};

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
