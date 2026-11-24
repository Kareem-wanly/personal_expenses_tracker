import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/brand";
import { APP_DESCRIPTION, APP_NAME } from "@masrufi/core/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${APP_NAME} — متتبّع المصاريف`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Android draws its launch screen from this colour + the icon + the name.
    background_color: BRAND.solid,
    theme_color: BRAND.solid,
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "إضافة مصروف",
        short_name: "إضافة",
        url: "/?add=1",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "التقرير الشهري",
        short_name: "التقرير",
        url: "/reports",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
