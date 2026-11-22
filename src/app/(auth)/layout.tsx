import { Reveal } from "@/components/motion/reveal";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

/**
 * Sign-in / sign-up: a wordmark set in the display face on plain paper, a
 * ruled line, then the form. No gradient wash, no glowing app icon.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 pt-safe pb-safe">
      <div className="w-full max-w-sm py-10">
        <Reveal className="mb-10">
          <p className="font-display text-[44px] font-semibold leading-none">{APP_NAME}</p>
          <div className="mt-5 h-px bg-hairline" />
          <p className="mt-4 max-w-[17rem] text-[15px] leading-relaxed text-muted-foreground">{APP_DESCRIPTION}</p>
        </Reveal>
        {children}
      </div>
    </main>
  );
}
