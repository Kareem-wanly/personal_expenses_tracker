import { Reveal } from "@/components/motion/reveal";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 pt-safe pb-safe">
      {/* Soft colour wash behind the icon, like a welcome screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55dvh] opacity-70 dark:opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 10%, color-mix(in oklab, var(--primary) 32%, transparent), transparent 70%)," +
            "radial-gradient(50% 50% at 15% 25%, rgb(10 132 255 / 0.18), transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-sm py-10">
        <Reveal className="mb-9 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon.svg"
            alt=""
            className="size-20 rounded-[22px] shadow-[0_18px_40px_-14px_rgb(4_120_87/0.6)]"
          />
          <h1 className="mt-2 text-[30px] font-bold leading-tight">{APP_NAME}</h1>
          <p className="max-w-[18rem] text-[15px] text-muted-foreground">{APP_DESCRIPTION}</p>
        </Reveal>
        {children}
      </div>
    </main>
  );
}
