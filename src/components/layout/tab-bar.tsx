"use client";

import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { openExpenseForm } from "@/components/expenses/expense-form-store";
import { TAB_ICONS } from "@/components/layout/tab-icons";
import { TABS, tabTransition } from "@/lib/tabs";
import { cn } from "@/lib/utils";

import { useTabNav } from "./tab-nav";

const PILL_SPRING = { type: "spring", stiffness: 480, damping: 38 } as const;

/**
 * Floating glass tab bar with a sliding selection pill, plus a separate
 * round "add" button — the main action is always one tap away.
 */
export function TabBar() {
  const { current, active, markPending } = useTabNav();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),14px)]"
      style={{ viewTransitionName: "tab-bar" }}
    >
      <div className="mx-auto flex max-w-md items-center gap-3 px-4">
        <nav
          aria-label="التنقّل الرئيسي"
          className="glass pointer-events-auto flex h-16 flex-1 items-stretch rounded-full p-1"
        >
          {TABS.map((tab, i) => {
            const Icon = TAB_ICONS[tab.href];
            const isActive = i === active;
            const isOther = i !== current;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={i === current ? "page" : undefined}
                transitionTypes={isOther && current >= 0 ? tabTransition(current, i) : undefined}
                onClick={() => isOther && markPending(i)}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] font-semibold outline-none",
                  "text-foreground/70 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "text-primary",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={PILL_SPRING}
                    className="absolute inset-0 rounded-full bg-foreground/[0.07] dark:bg-white/[0.12]"
                  />
                )}
                <Icon className="relative size-[22px]" strokeWidth={isActive ? 2.3 : 1.9} />
                <span className="relative">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <motion.button
          type="button"
          onClick={() => openExpenseForm()}
          aria-label="إضافة مصروف"
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className="tint-button pointer-events-auto flex size-16 shrink-0 items-center justify-center rounded-full"
        >
          <PlusIcon className="size-7" strokeWidth={2.4} />
        </motion.button>
      </div>
    </div>
  );
}
