"use client";

import { PaletteIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Group, Row, RowIcon } from "@/components/ui/grouped-list";
import { SegmentedControl } from "@/components/ui/segmented-control";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "فاتح" },
  { value: "dark", label: "داكن" },
  { value: "system", label: "تلقائي" },
];

const noop = () => () => {};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  // Theme is only known on the client; avoid a hydration mismatch.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const value = (mounted ? theme : "system") as Theme;

  return (
    <Group header="المظهر" footer="«تلقائي» يتبع إعداد جهازك.">
      <Row
        leading={<RowIcon icon={PaletteIcon} />}
        title="السِّمة"
        trailing={
          <SegmentedControl
            label="المظهر"
            value={value}
            onChange={setTheme}
            options={OPTIONS}
            className="w-52"
          />
        }
      />
    </Group>
  );
}
