import { ViewTransition } from "react";

import { TAB_BACK, TAB_FORWARD } from "@/lib/tabs";

const SLIDE = {
  [TAB_FORWARD]: TAB_FORWARD,
  [TAB_BACK]: TAB_BACK,
  default: "none",
};

/**
 * Wrap each tab's page so switching tabs slides screens in the direction
 * of travel (see the `tab-*` rules in globals.css). Must live in the page,
 * not the layout: layouts persist, so they never enter or exit.
 */
export function TabScreen({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={SLIDE} exit={SLIDE} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
