"use client";

import { useEffect } from "react";

import { TZ_COOKIE } from "@/lib/dates";
import { syncTimeZone } from "@/server/actions";

/** Tell the server the device time zone so "today" matches the user's clock. */
export function TzSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${TZ_COOKIE}=`))
      ?.split("=")[1];
    if (tz && decodeURIComponent(current ?? "") !== tz) {
      void syncTimeZone(tz);
    }
  }, []);
  return null;
}
