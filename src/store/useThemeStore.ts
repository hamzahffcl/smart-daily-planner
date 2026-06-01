import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeColor = "violet" | "emerald" | "rose" | "amber" | "slate";
export type ThemeTexture = "none" | "grid" | "dots" | "glass";

interface ThemeState {
  themeColor: ThemeColor;
  texture: ThemeTexture;
  setThemeColor: (color: ThemeColor) => void;
  setTexture: (texture: ThemeTexture) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeColor: "violet",
      texture: "none",
      setThemeColor: (color) => set({ themeColor: color }),
      setTexture: (texture) => set({ texture: texture }),
    }),
    {
      name: "smart-planner-theme-texture",
    }
  )
);
