"use client";

import {
  ChartPieIcon,
  HouseIcon,
  PlusIcon,
  ReceiptTextIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { openExpenseForm } from "@/components/expenses/expense-form-store";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "الرئيسية", icon: HouseIcon },
  { href: "/expenses", label: "المصاريف", icon: ReceiptTextIcon },
  null, // FAB slot
  { href: "/reports", label: "التقارير", icon: ChartPieIcon },
  { href: "/settings", label: "الإعدادات", icon: SettingsIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="التنقّل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-lg pb-safe"
    >
      <ul className="mx-auto grid h-16 max-w-2xl grid-cols-5 items-center">
        {LINKS.map((link, i) => {
          if (!link) {
            return (
              <li key={i} className="flex justify-center">
                <button
                  type="button"
                  onClick={() => openExpenseForm()}
                  aria-label="إضافة مصروف"
                  className="-mt-8 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
                >
                  <PlusIcon className="size-7" strokeWidth={2.5} />
                </button>
              </li>
            );
          }
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
