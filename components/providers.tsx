"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { ProvidersProps } from "@/types";

export function Providers({ children }: ProvidersProps) {
  // P4-2 replaces the initial empty session with the server session.
  return (
    <SessionProvider session={null} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          {children}
          <Toaster position="bottom-left" />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
