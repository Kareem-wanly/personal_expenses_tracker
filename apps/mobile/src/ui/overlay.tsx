import type { ReactNode } from "react";
import { Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

/** Above everything. On iOS open sheets live in their own layer, so this needs one above them. */
export function Overlay({ children }: { children: ReactNode }) {
  return Platform.OS === "ios" ? <FullWindowOverlay>{children}</FullWindowOverlay> : <>{children}</>;
}
