/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Leave Web Worker scripts to the network. Turbopack passes each worker its
// bootstrap config in the URL fragment (#params=…), and a response served
// by a service worker never carries a fragment (Response.url drops it), so
// the worker would start without its config. Registered before Serwist so
// it runs first and Serwist never calls respondWith for these requests.
self.addEventListener("fetch", (event) => {
  if (event.request.destination === "worker") event.stopImmediatePropagation();
});

serwist.addEventListeners();

/* ------------------------------ Web Push ------------------------------- */

type PushPayload = { title: string; body: string; url?: string; tag?: string };

self.addEventListener("push", (event) => {
  let data: PushPayload = { title: "مصروفي", body: "" };
  try {
    data = { ...data, ...(event.data?.json() as PushPayload) };
  } catch {
    data.body = event.data?.text() ?? "";
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      dir: "rtl",
      lang: "ar",
      tag: data.tag,
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data as { url?: string })?.url ?? "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Reuse an open app window if there is one.
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
