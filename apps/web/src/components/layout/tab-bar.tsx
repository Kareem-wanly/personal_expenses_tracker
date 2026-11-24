"use client";

import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Fragment } from "react";

import { openExpenseForm } from "@/components/expenses/expense-form-store";
import { TAB_ICONS } from "@/components/layout/tab-icons";
import { TABS, tabTransition } from "@/lib/tabs";
import { cn } from "@/lib/utils";

import { useTabNav } from "./tab-nav";

const MARK_SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;

/**
 * Docked tab bar on paper: hairline on top, a short accent rule over the
 * active tab, and the "add" action as an ink key in the middle.
 */
export function TabBar() {
  const { current, active, markPending } = useTabNav();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      style={{ viewTransitionName: "tab-bar" }}
    >
      <nav aria-label="التنقّل الرئيسي" className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch px-2">
        {TABS.map((tab, i) => {
          const Icon = TAB_ICONS[tab.href];
          const isActive = i === active;
          const isOther = i !== current;
          return (
            <Fragment key={tab.href}>
              {i === 2 && (
                <div className="flex items-center justify-center">
                  <motion.button
                    type="button"
                    onClick={() => openExpenseForm()}
                    aria-label="إضافة مصروف"
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 600, damping: 30 }}
                    className="tint-button flex size-12 items-center justify-center rounded-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PlusIcon className="size-6" strokeWidth={2.2} />
                  </motion.button>
                </div>
              )}
              <Link
                href={tab.href}
                aria-current={i === current ? "page" : undefined}
                transitionTypes={isOther && current >= 0 ? tabTransition(current, i) : undefined}
                onClick={() => isOther && markPending(i)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none",
                  "text-muted-foreground transition-colors duration-200 focus-visible:text-foreground",
                  isActive && "text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-mark"
                    transition={MARK_SPRING}
                    className="absolute top-0 h-[2px] w-7 rounded-b-full bg-primary"
                  />
                )}
                <Icon className="size-[22px]" strokeWidth={isActive ? 2 : 1.6} />
                <span>{tab.label}</span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
