import { useMemo, type Ref, type RefCallback } from "react";

/** Combines multiple refs (forwarded + local) into a single ref callback. */
export function useMergedRef<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return useMemo(
    () => (node: T) => {
      for (const ref of refs) {
        if (!ref) continue;
        if (typeof ref === "function") {
          ref(node);
        } else {
          (ref as { current: T | null }).current = node;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );
}
