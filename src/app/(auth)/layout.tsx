import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary/10 to-background p-4 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon.svg" alt="" className="size-16 rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">{APP_DESCRIPTION}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
