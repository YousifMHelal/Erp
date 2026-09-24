import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiStore = {
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  density: "compact" | "comfortable";
  setDensity: (density: "compact" | "comfortable") => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarExpanded: true,
      toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      density: "comfortable",
      setDensity: (density) => set({ density }),
    }),
    { name: "erp-ui-store", partialize: (s) => ({ sidebarExpanded: s.sidebarExpanded, density: s.density }) },
  ),
);
