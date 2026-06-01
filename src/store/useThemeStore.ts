import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeColor = "violet" | "emerald" | "rose" | "amber" | "slate";

interface ThemeState {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeColor: "violet",
      setThemeColor: (color) => set({ themeColor: color }),
    }),
    {
      name: "smart-planner-theme-color",
    }
  )
);
