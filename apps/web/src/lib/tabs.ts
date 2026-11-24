/**
 * The app's top-level screens, in reading order (right → left in RTL).
 * Their order defines the direction of tab transitions and of the
 * horizontal swipe between screens.
 */
export const TABS = [
  { href: "/", label: "الرئيسية" },
  { href: "/expenses", label: "السجلّ" },
  { href: "/reports", label: "التقارير" },
  { href: "/settings", label: "الإعدادات" },
] as const;

export type TabHref = (typeof TABS)[number]["href"];

/** Index of the tab a pathname belongs to, or -1 for non-tab routes. */
export function tabIndexOf(pathname: string): number {
  if (pathname === "/") return 0;
  return TABS.findIndex((t) => t.href !== "/" && pathname.startsWith(t.href));
}

/** View-transition types: "forward" = towards later tabs. */
export const TAB_FORWARD = "tab-forward";
export const TAB_BACK = "tab-back";

export function tabTransition(from: number, to: number): string[] {
  return [to > from ? TAB_FORWARD : TAB_BACK];
}
