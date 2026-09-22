"use client";

import { useEffect, useRef } from "react";

/**
 * Defers a callback until `delay` ms after the last call. Used to keep typing in a
 * search box from firing a server round-trip per keystroke. The latest callback is
 * held in a ref so the returned function stays stable across renders.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (...args: Args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
  };
}
