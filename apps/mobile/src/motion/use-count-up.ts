import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

const DURATION = 900;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** A number that glides from its previous value to the new one. */
export function useCountUp(target: number): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? target : 0);
  const current = useRef(shown);

  useEffect(() => {
    const from = current.current;
    if (reduced || from === target) {
      current.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - start) / DURATION);
      current.current = Math.round(from + (target - from) * easeOutExpo(progress));
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);

  return shown;
}
