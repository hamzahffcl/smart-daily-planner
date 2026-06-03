import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeColor = "violet" | "emerald" | "rose" | "amber" | "slate" | "cozy-pixel";
export type ThemeTexture = "none" | "mesh" | "grid" | "dots" | "pixel-grid";

interface ThemeState {
  themeColor: ThemeColor;
  themeTexture: ThemeTexture;
  setThemeColor: (color: ThemeColor) => void;
  setThemeTexture: (texture: ThemeTexture) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeColor: "violet",
      themeTexture: "none",
      setThemeColor: (color) => set({ themeColor: color }),
      setThemeTexture: (texture) => set({ themeTexture: texture }),
    }),
    {
      name: "smart-planner-theme-color-v2",
    }
  )
);
