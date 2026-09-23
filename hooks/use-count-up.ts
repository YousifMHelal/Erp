import { useEffect, useRef, useState } from "react";

const DURATION_MS = 600;

function usesReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Animates from 0 to `target` over 600ms (KPI tiles only, per UI_DESIGN_RULES §7.1). Skips the animation under `prefers-reduced-motion`. */
export function useCountUp(target: number): number {
  const [value, setValue] = useState(() => (usesReducedMotion() ? target : 0));
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    if (usesReducedMotion()) {
      setValue(target);
      return;
    }

    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(targetRef.current * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
