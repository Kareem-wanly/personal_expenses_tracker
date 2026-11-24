import type { IconName } from "@/ui/icon";

/** Right to left, as the bar shows them; "+" sits in the middle. */
export const TABS = [
  { name: "index", href: "/", label: "الرئيسية", icon: "home" },
  { name: "ledger", href: "/ledger", label: "السجلّ", icon: "ledger" },
  { name: "reports", href: "/reports", label: "التقارير", icon: "reports" },
  { name: "more", href: "/more", label: "المزيد", icon: "more" },
] as const satisfies { name: string; href: string; label: string; icon: IconName }[];

export type TabName = (typeof TABS)[number]["name"];

export const tabIndex = (name: string) => TABS.findIndex((tab) => tab.name === name);

let lastShown = -1;

/** Which way to slide in: 1 = from the left (a later tab), -1 = from the right, 0 = first page shown. */
export function arrivalDirection(index: number): 1 | -1 | 0 {
  const previous = lastShown;
  lastShown = index;
  if (previous === -1 || previous === index) return 0;
  return index > previous ? 1 : -1;
}
