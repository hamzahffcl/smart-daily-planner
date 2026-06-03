"use client";

import React, { useEffect, useState } from "react";
import { useThemeStore } from "@/store/useThemeStore";

export function ThemeTextureProvider({ children }: { children: React.ReactNode }) {
  const themeColor = useThemeStore((state) => state.themeColor);
  const themeTexture = useThemeStore((state) => state.themeTexture);
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

    // Manage pixel font class
    if (themeColor === "cozy-pixel") {
      root.classList.add("font-pixel");
      root.classList.add("pixel-theme-active");
    } else {
      root.classList.remove("font-pixel");
      root.classList.remove("pixel-theme-active");
    }
  }, [themeColor, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  // Determine active texture class
  let textureClass = "";
  if (themeTexture === "mesh") textureClass = "mesh-bg";
  else if (themeTexture === "grid") textureClass = "grid-bg";
  else if (themeTexture === "dots") textureClass = "dots-bg";
  else if (themeTexture === "pixel-grid") textureClass = "pixel-grid-bg";
  else if (themeColor === "cozy-pixel") textureClass = "pixel-grid-bg opacity-40"; // default texture for cozy pixel

  return (
    <div className="min-h-screen w-full relative transition-all duration-300 flex flex-col bg-background text-foreground">
      {/* Background Texture Overlay */}
      {textureClass && (
        <div className={`absolute inset-0 pointer-events-none -z-20 transition-all duration-500 ${textureClass}`} />
      )}
      
      {/* Soft Vignette and Ambient Overlay for cozy vibe */}
      {themeColor === "cozy-pixel" && (
        <div className="absolute inset-0 pointer-events-none -z-10 bg-radial-[circle_at_center,transparent_45%,rgba(50,30,27,0.06)] dark:bg-radial-[circle_at_center,transparent_45%,rgba(15,8,7,0.35)]" />
      )}
      
      {children}
    </div>
  );
}
