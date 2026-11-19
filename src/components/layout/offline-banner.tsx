"use client";

import { WifiOffIcon } from "lucide-react";
import { useOffline } from "next/offline";

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] text-xs font-medium text-white"
    >
      <WifiOffIcon className="size-3.5" />
      غير متصل — سيتم إرسال التغييرات تلقائياً عند عودة الاتصال
    </div>
  );
}
