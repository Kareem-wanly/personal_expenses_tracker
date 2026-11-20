"use client";

import { type AnimationPlaybackControls, animate } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { TAB_ICONS } from "@/components/layout/tab-icons";
import { TABS } from "@/lib/tabs";
import { cn } from "@/lib/utils";

import { useTabNav } from "./tab-nav";

/** Ignore touches this close to the screen edges (browser back gestures). */
const EDGE_GUARD = 16;
/** Movement (px) before deciding whether the gesture is horizontal. */
const AXIS_LOCK = 10;
/** Commit when dragged past this share of the width… */
const COMMIT_RATIO = 0.28;
/** …or when flicked faster than this (px/ms) in the drag direction. */
const COMMIT_VELOCITY = 0.45;

const SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } as const;

/** iOS-style rubber band: resistance grows the further you pull. */
function rubberBand(offset: number, width: number) {
  const c = 0.55;
  const abs = Math.abs(offset);
  return Math.sign(offset) * (1 - 1 / ((abs * c) / width + 1)) * width;
}

/** Elements that own horizontal gestures themselves. */
function blocksSwipe(target: EventTarget | null, root: HTMLElement): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== root) {
    if (el instanceof HTMLElement) {
      if (el.dataset.noSwipe !== undefined) return true;
      if (el.matches("input, textarea, select, [contenteditable='true'], [role='slider']")) {
        return true;
      }
      if (el.scrollWidth > el.clientWidth + 1) {
        const ox = getComputedStyle(el).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

type Gesture = {
  id: number;
  x0: number;
  y0: number;
  base: number;
  locked: boolean;
  target: number | null;
  lastX: number;
  lastT: number;
  velocity: number;
};

type Peek = { index: number; side: "left" | "right" };

/**
 * Wraps the current screen and lets the user swipe horizontally to the
 * neighbouring tab, like paging between screens in a native app.
 *
 * The page follows the finger; on release it either springs back or
 * navigates, and the route's view transition carries the old page out
 * from where the finger left it while the next one slides in.
 */
export function SwipePager({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const nav = useTabNav();
  const [peek, setPeek] = useState<Peek | null>(null);
  // A new screen never shows the previous gesture's hint.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setPeek(null);
  }

  // Latest values for the native listeners, without re-binding them.
  const navRef = useRef(nav);
  const peekStateRef = useRef<Peek | null>(null);
  const xRef = useRef(0);
  const settleRef = useRef<AnimationPlaybackControls | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    navRef.current = nav;
  });

  // The new page commits in the same frame as this effect: put the pager
  // back at rest so the view transition snapshots the new page centred.
  useLayoutEffect(() => {
    clearTimeout(fallbackRef.current);
    settleRef.current?.stop();
    xRef.current = 0;
    if (ref.current) {
      ref.current.style.transform = "";
      ref.current.style.willChange = "";
    }
    peekStateRef.current = null;
    if (peekRef.current) peekRef.current.style.opacity = "0";
  }, [pathname]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    let g: Gesture | null = null;
    let armed = false;

    const setX = (x: number) => {
      xRef.current = x;
      el.style.transform = x ? `translate3d(${x}px,0,0)` : "";
    };

    const showPeek = (next: Peek | null) => {
      const prev = peekStateRef.current;
      if (prev?.index === next?.index && prev?.side === next?.side) return;
      peekStateRef.current = next;
      setPeek(next);
    };

    const paintPeek = (x: number, committing: boolean) => {
      const p = peekRef.current;
      if (!p) return;
      const progress = Math.min(1, Math.abs(x) / (el.clientWidth * COMMIT_RATIO));
      p.style.opacity = String(progress);
      p.style.transform = `translateY(-50%) scale(${committing ? 1 : 0.85 + progress * 0.1})`;
      p.dataset.armed = committing ? "true" : "false";
    };

    const springBack = () => {
      settleRef.current?.stop();
      settleRef.current = animate(xRef.current, 0, {
        ...SPRING,
        onUpdate: (v) => {
          setX(v);
          paintPeek(v, false);
        },
        onComplete: () => {
          el.style.willChange = "";
          showPeek(null);
        },
      });
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !e.isPrimary) return;
      if (navRef.current.current < 0) return;
      if (e.clientX < EDGE_GUARD || e.clientX > window.innerWidth - EDGE_GUARD) return;
      if (blocksSwipe(e.target, el)) return;
      settleRef.current?.stop();
      g = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        base: xRef.current,
        locked: false,
        target: null,
        lastX: e.clientX,
        lastT: e.timeStamp,
        velocity: 0,
      };
    };

    const onMove = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;

      if (!g.locked) {
        if (Math.hypot(dx, dy) < AXIS_LOCK) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.2) {
          g = null; // vertical scroll: let the browser have it
          return;
        }
        g.locked = true;
        g.x0 = e.clientX; // start from here: no jump of AXIS_LOCK px
        el.style.willChange = "transform";
        armed = false;
      }

      const dt = e.timeStamp - g.lastT;
      if (dt > 0) g.velocity = (e.clientX - g.lastX) / dt;
      g.lastX = e.clientX;
      g.lastT = e.timeStamp;

      const raw = g.base + (e.clientX - g.x0);
      const width = el.clientWidth;
      // Content moving right reveals the screen on the left, which is the
      // *next* tab in RTL (tabs read right → left) and the previous in LTR.
      const step = raw > 0 === rtl ? 1 : -1;
      const target = navRef.current.current + step;
      const exists = raw !== 0 && target >= 0 && target < TABS.length;
      g.target = exists ? target : null;

      const x = exists ? raw : rubberBand(raw, width);
      setX(x);

      if (!exists) {
        showPeek(null);
        return;
      }
      showPeek({ index: target, side: raw > 0 ? "left" : "right" });
      const committing = Math.abs(x) > width * COMMIT_RATIO;
      if (committing && !armed) navigator.vibrate?.(8);
      armed = committing;
      paintPeek(x, committing);
    };

    const onEnd = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return;
      const gesture = g;
      g = null;
      if (!gesture.locked) return;

      const x = xRef.current;
      const flick =
        Math.abs(gesture.velocity) > COMMIT_VELOCITY &&
        Math.sign(gesture.velocity) === Math.sign(x);
      const far = Math.abs(x) > el.clientWidth * COMMIT_RATIO;

      if (e.type !== "pointercancel" && gesture.target !== null && (far || flick)) {
        paintPeek(x, true);
        navRef.current.go(gesture.target);
        // Keep gliding while the next screen loads, so the hand-off never
        // freezes. The view transition picks up from wherever it got to.
        const glideTo = Math.sign(x) * Math.max(Math.abs(x), el.clientWidth * 0.6);
        settleRef.current?.stop();
        settleRef.current = animate(x, glideTo, {
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: setX,
        });
        // If the navigation never commits (offline, error), don't leave the
        // page stranded off-centre.
        clearTimeout(fallbackRef.current);
        fallbackRef.current = setTimeout(springBack, 2000);
      } else {
        springBack();
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onEnd);
    el.addEventListener("pointercancel", onEnd);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onEnd);
      el.removeEventListener("pointercancel", onEnd);
      settleRef.current?.stop();
      clearTimeout(fallbackRef.current);
    };
  }, []);

  const PeekIcon = peek ? TAB_ICONS[TABS[peek.index].href] : null;

  return (
    <>
      <div
        ref={ref}
        className="relative z-[1] min-h-dvh bg-background [touch-action:pan-y_pinch-zoom]"
      >
        {children}
      </div>

      {/* Hint of the screen being revealed, behind the sliding page. */}
      <div
        ref={peekRef}
        aria-hidden
        data-armed="false"
        className={cn(
          "pointer-events-none fixed top-1/2 z-0 flex flex-col items-center gap-1.5 opacity-0 transition-colors duration-200",
          "text-muted-foreground data-[armed=true]:text-primary",
          peek?.side === "left" ? "left-5" : "right-5",
          !peek && "hidden",
        )}
      >
        {PeekIcon && (
          <>
            <span className="glass flex size-12 items-center justify-center rounded-full">
              <PeekIcon className="size-5" strokeWidth={2.2} />
            </span>
            <span className="text-[11px] font-semibold">{TABS[peek!.index].label}</span>
          </>
        )}
      </div>
    </>
  );
}
