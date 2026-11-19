"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
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

  const chips = [{ id: "", name: "الكل", icon: "✨" }, ...categories];

  return (
    <div className={cn("space-y-3 transition-opacity", isPending && "opacity-70")}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث في الملاحظات…"
          aria-label="بحث"
          className="h-11 ps-9 pe-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="مسح البحث"
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
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
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted",
              )}
            >
              <span aria-hidden>{c.icon}</span>
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
