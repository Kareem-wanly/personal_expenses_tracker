"use client";

import { DownloadIcon, PlusSquareIcon, ShareIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { APP_NAME } from "@/lib/constants";
import { promptInstall, useInstallPrompt } from "@/lib/install-prompt";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "install-banner-dismissed-at";
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 1200;
/** Pages without the bottom navigation bar. */
const NO_NAV = ["/login", "/register", "/~offline"];

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * First-visit "install the app" sheet. On Android/desktop it triggers the
 * real PWA install dialog; on iOS it explains Share → Add to Home Screen.
 * Dismissal is remembered for a week.
 */
export function InstallBanner() {
  const pathname = usePathname();
  const { mounted, installed, canPrompt, ios } = useInstallPrompt();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Let the page settle before sliding in.
    const t = setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const visible =
    mounted &&
    ready &&
    !dismissed &&
    !recentlyDismissed() &&
    !installed &&
    (canPrompt || ios);
  if (!visible) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

  async function install() {
    const accepted = await promptInstall();
    if (accepted) toast.success(`تم تثبيت ${APP_NAME} 🎉`);
    else dismiss();
  }

  const hasNav = !NO_NAV.includes(pathname);

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      className={cn(
        "fixed inset-x-3 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-6 duration-300",
        hasNav
          ? "bottom-[calc(6rem+max(env(safe-area-inset-bottom),14px))]"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="glass rounded-[22px] p-4 text-popover-foreground">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="size-12 rounded-[13px] shadow" />
          <div className="min-w-0 flex-1">
            <p id="install-title" className="text-[16px] font-semibold">
              ثبّت {APP_NAME} على جوالك
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              يفتح بلمسة من الشاشة الرئيسية بشاشة كاملة، ويصلك منه تنبيهات الميزانية.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="إغلاق"
            className="-m-1 flex size-7 items-center justify-center rounded-full bg-foreground/[0.07] text-muted-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {canPrompt ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="tint-button flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold active:scale-[0.97]"
            >
              <DownloadIcon className="size-[18px]" />
              تثبيت التطبيق
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-11 rounded-full px-4 text-[15px] font-medium text-primary active:opacity-60"
            >
              لاحقاً
            </button>
          </div>
        ) : (
          <ol className="mt-3 space-y-2 rounded-[14px] bg-foreground/[0.05] p-3 text-[14px] dark:bg-white/[0.08]">
            <li className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-card text-xs font-semibold">
                1
              </span>
              اضغط زر المشاركة
              <ShareIcon className="size-4 text-primary" aria-label="مشاركة" />
              في Safari
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-card text-xs font-semibold">
                2
              </span>
              اختر «إضافة إلى الشاشة الرئيسية»
              <PlusSquareIcon className="size-4 text-primary" aria-hidden />
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}
