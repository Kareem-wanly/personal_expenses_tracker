import type { Metadata } from "next";
import { WifiOffIcon } from "lucide-react";

export const metadata: Metadata = { title: "غير متصل" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-full bg-muted p-5">
        <WifiOffIcon className="size-10 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold">أنت غير متصل بالإنترنت</h1>
      <p className="max-w-xs text-muted-foreground">
        تحقّق من الاتصال ثم حاول مجدداً. الصفحات التي فتحتها سابقاً ما زالت متاحة.
      </p>
    </main>
  );
}
