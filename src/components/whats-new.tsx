"use client";

import { GiftIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";

import { SPRING } from "@/components/expenses/sheet-parts";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Group, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { LATEST_RELEASE, type Release } from "@/lib/changelog";

const SEEN_KEY = "whats-new-seen";
const SHOW_DELAY_MS = 900;

/* Tiny store so Settings can reopen the sheet. */
let openState = false;
const listeners = new Set<() => void>();
const setOpenState = (v: boolean) => {
  openState = v;
  listeners.forEach((l) => l());
};
export const openWhatsNew = () => setOpenState(true);
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function markSeen(release: Release) {
  try {
    localStorage.setItem(SEEN_KEY, release.version);
  } catch {}
}

/**
 * "What's new" sheet: shown once after each release (tracked per device in
 * localStorage), and on demand from Settings.
 */
export function WhatsNew() {
  const open = useSyncExternalStore(subscribe, () => openState, () => false);
  const release = LATEST_RELEASE;

  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(SEEN_KEY);
    } catch {
      return; // storage blocked: never nag
    }
    if (seen === release.version) return;
    const t = setTimeout(() => setOpenState(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [release.version]);

  function close() {
    markSeen(release);
    setOpenState(false);
  }

  return (
    <Drawer open={open} onOpenChange={(next) => (next ? setOpenState(true) : close())} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-2xl border-t-0 bg-background data-[swipe-direction=down]:rounded-t-[28px] dark:bg-[#1c1c1e] dark:[--card:#2c2c2e]">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-4">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-[20px] bg-primary/15 text-[32px]">🎉</span>
              <DrawerTitle className="mt-3 text-[24px] font-bold">ما الجديد</DrawerTitle>
              <DrawerDescription className="mt-1 text-[15px] text-muted-foreground">
                {release.title}
              </DrawerDescription>
            </div>
            <ul className="mt-6 space-y-5">
              {release.items.map((item, i) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.35 }}
                  className="flex gap-4"
                >
                  <span aria-hidden className="mt-0.5 text-[28px] leading-none">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <motion.button
              type="button"
              onClick={close}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              className="tint-button flex h-[52px] w-full items-center justify-center rounded-full text-[17px] font-semibold"
            >
              متابعة
            </motion.button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** Settings row: "ما الجديد" with the current version; reopens the sheet. */
export function WhatsNewRow() {
  return (
    <Group>
      <RowButton
        onClick={openWhatsNew}
        leading={<RowIcon icon={GiftIcon} tint="#ff2d55" />}
        title="ما الجديد"
        subtitle={`الإصدار ${LATEST_RELEASE.version} · ${LATEST_RELEASE.title}`}
        chevron
      />
    </Group>
  );
}
