"use client";

import { animate, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef } from "react";

import { formatMoney } from "@masrufi/core/money";

/**
 * A money amount that counts up to its value (and glides between values
 * when it changes, e.g. after adding an expense). Writes straight to the
 * DOM each frame, so it never re-renders React.
 */
export function AnimatedMoney({
  value,
  currency,
  className,
}: {
  value: number;
  currency: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = formatMoney(value, currency);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = formatMoney(Math.round(v), currency);
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, currency, reduce]);

  return (
    <span ref={ref} className={className} dir="ltr">
      {formatMoney(value, currency)}
    </span>
  );
}
