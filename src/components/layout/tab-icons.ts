import {
  ChartPieIcon,
  HouseIcon,
  type LucideIcon,
  ReceiptTextIcon,
  Settings2Icon,
} from "lucide-react";

import type { TabHref } from "@/lib/tabs";

export const TAB_ICONS: Record<TabHref, LucideIcon> = {
  "/": HouseIcon,
  "/expenses": ReceiptTextIcon,
  "/reports": ChartPieIcon,
  "/settings": Settings2Icon,
};
