"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/server/queries";

export function ExpenseFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const activeCategory = searchParams.get("category") ?? "";

  function update(key: string, value: string) {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value);
    else sp.delete(key);
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Debounce search to avoid a request per keystroke.
  useEffect(() => {
    if (q === (searchParams.get("q") ?? "")) return;
    const t = setTimeout(() => update("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const chips = [{ id: "", name: "الكل", icon: "", color: "" }, ...categories];

  return (
    <div className={cn("space-y-3 transition-opacity duration-200", isPending && "opacity-60")}>
      {/* iOS search field */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث في الملاحظات"
          aria-label="بحث"
          enterKeyHint="search"
          className="h-10 w-full rounded-[11px] bg-foreground/[0.07] pe-9 ps-9 text-[16px] outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring dark:bg-white/[0.1]"
        />
        <AnimatePresence>
          {q && (
            <motion.button
              type="button"
              onClick={() => setQ("")}
              aria-label="مسح البحث"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              className="absolute end-2.5 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-muted-foreground/60 text-background"
            >
              <XIcon className="size-3" strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Category chips with a sliding selection pill */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="تصفية حسب التصنيف"
      >
        {chips.map((c) => {
          const active = activeCategory === c.id;
          return (
            <button
              key={c.id || "all"}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update("category", c.id)}
              className={cn(
                "relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition-colors duration-200 active:scale-95",
                active ? "text-primary-foreground" : "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
              )}
            >
              {active && (
                <motion.span
                  layoutId="category-chip"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              {c.icon && (
                <span aria-hidden className="relative">
                  {c.icon}
                </span>
              )}
              <span className="relative">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
