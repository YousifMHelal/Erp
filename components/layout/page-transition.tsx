"use client";

import { usePathname } from "next/navigation";
import type { PageTransitionProps } from "@/types";

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}
