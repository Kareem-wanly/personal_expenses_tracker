import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const onWeb = Platform.OS === "web";

/** Small values kept on this device (encrypted on phones). Never throws. */
export const storage = {
  get(key: string): string | null {
    try {
      return onWeb ? localStorage.getItem(key) : SecureStore.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null): void {
    try {
      if (onWeb) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } else if (value === null) void SecureStore.deleteItemAsync(key);
      else SecureStore.setItem(key, value);
    } catch {
      // Nothing to do: the value is a convenience.
    }
  },
};
