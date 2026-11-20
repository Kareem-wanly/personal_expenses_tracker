"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

/** iOS-proportioned switch (51×31, white thumb that slides with iOS easing). */
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full p-[2px] transition-colors duration-300 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "data-[size=default]:h-[31px] data-[size=default]:w-[51px] data-[size=sm]:h-[22px] data-[size=sm]:w-[36px]",
        "data-checked:bg-primary data-unchecked:bg-foreground/[0.12] dark:data-unchecked:bg-white/[0.18]",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_3px_1px_rgb(0_0_0/0.06)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "group-data-[size=default]/switch:size-[27px] group-data-[size=sm]/switch:size-[18px]",
          "data-unchecked:translate-x-0",
          "group-data-[size=default]/switch:data-checked:translate-x-[20px] rtl:group-data-[size=default]/switch:data-checked:-translate-x-[20px]",
          "group-data-[size=sm]/switch:data-checked:translate-x-[14px] rtl:group-data-[size=sm]/switch:data-checked:-translate-x-[14px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
