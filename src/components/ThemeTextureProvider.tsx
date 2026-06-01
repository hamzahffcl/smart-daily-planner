"use client";

import React, { useEffect, useState } from "react";
import { useThemeStore } from "@/store/useThemeStore";

export function ThemeTextureProvider({ children }: { children: React.ReactNode }) {
  const themeColor = useThemeStore((state) => state.themeColor);
  const texture = useThemeStore((state) => state.texture);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) {
        root.classList.remove(cls);
      }
    });
    
    // Add current theme class
    root.classList.add(`theme-${themeColor}`);
  }, [themeColor, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  const textureClass = texture !== "none" ? `texture-${texture}` : "";

  return (
    <div className={`min-h-screen w-full relative transition-all duration-300 ${textureClass}`}>
      {children}
    </div>
  );
}
