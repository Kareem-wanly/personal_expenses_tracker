import { useRouter } from "expo-router";

import type { SheetName } from "./registry";

/** `open("debt", { id })` raises a sheet over the current page. */
export function useOpenSheet() {
  const router = useRouter();
  return (name: SheetName, params: Record<string, string> = {}) =>
    router.push({ pathname: "/sheet/[name]", params: { ...params, name } });
}
