import type { ReactNode } from "react";

export type ProvidersProps = { children: ReactNode };
export type RootLayoutProps = { children: ReactNode };

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
