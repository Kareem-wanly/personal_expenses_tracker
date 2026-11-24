import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-foreground/[0.07] dark:bg-white/[0.09]", className)}
      {...props}
    />
  )
}

export { Skeleton }
