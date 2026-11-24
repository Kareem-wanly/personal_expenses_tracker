import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { API_URL } from "./config";

const isWeb = Platform.OS === "web";

/** The session lives in the phone's secure storage (in the browser: a normal cookie). */
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: isWeb ? [] : [expoClient({ scheme: "masrufi", storagePrefix: "masrufi", storage: SecureStore })],
});

/** Session cookie to attach to our own requests; the browser attaches it by itself. */
export async function sessionCookie(): Promise<string> {
  if (isWeb) return "";
  return (authClient as unknown as { getCookie: () => string | Promise<string> }).getCookie();
}
