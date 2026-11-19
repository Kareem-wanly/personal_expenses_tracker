"use client";

import { useEffect } from "react";

import { TZ_COOKIE } from "@/lib/dates";
import { syncTimeZone } from "@/server/actions";

const SESSION_KEY = "tz-synced";

/**
 * Tell the server the device time zone so "today" matches the user's clock
 * (cookie for page renders, DB column for scheduled notifications).
 * Runs when the zone changed, or once per browser session.
 */
export function TzSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${TZ_COOKIE}=`))
      ?.split("=")[1];

    let synced = false;
    try {
      synced = sessionStorage.getItem(SESSION_KEY) === tz;
    } catch {}

    if (decodeURIComponent(current ?? "") !== tz || !synced) {
      void syncTimeZone(tz).then(() => {
        try {
          sessionStorage.setItem(SESSION_KEY, tz);
        } catch {}
      });
    }
  }, []);
  return null;
}
