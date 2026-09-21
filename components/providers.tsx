"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Direction } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { ProvidersProps } from "@/types";

export function Providers({ children }: ProvidersProps) {
  // P4-2 replaces the initial empty session with the server session.
  return (
    <SessionProvider session={null} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {/* Radix primitives (Tabs, Select, DropdownMenu, ...) default their internal `dir` to
            "ltr" unless told otherwise — this app is RTL-only, so a single Direction.Provider
            here fixes every Radix component at once instead of passing dir="rtl" to each one. */}
        <Direction.Provider dir="rtl">
          <TooltipProvider>
            {children}
            <Toaster position="bottom-left" />
          </TooltipProvider>
        </Direction.Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
