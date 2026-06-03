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
    <div className="min-h-screen w-full relative z-0 transition-all duration-300 flex flex-col">
      {/* Background Texture Overlay */}
      {textureClass && (
        <div className={`absolute inset-0 pointer-events-none -z-10 transition-all duration-500 ${textureClass}`} />
      )}
      
      {/* Soft Vignette and Ambient Overlay for cozy vibe */}
      {themeColor === "cozy-pixel" && (
        <div className="absolute inset-0 pointer-events-none -z-10 bg-radial-[circle_at_center,transparent_45%,rgba(50,30,27,0.06)] dark:bg-radial-[circle_at_center,transparent_45%,rgba(15,8,7,0.35)]" />
      )}

      {/* Cozy Pixel Art Corner Ornaments */}
      {themeColor === "cozy-pixel" && (
        <>
          {/* Top Left: Cozy Hanging Cafe Lamp */}
          <div className="fixed top-14 left-8 pointer-events-none hidden xl:block z-10 animate-pulse duration-[3000ms] select-none">
            <svg width="48" height="96" viewBox="0 0 16 32" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
              <rect x="7" y="0" width="1" height="18" fill="var(--border)" />
              <rect x="4" y="18" width="8" height="3" fill="#df8c8f" />
              <rect x="3" y="20" width="10" height="1" fill="var(--border)" />
              <rect x="7" y="21" width="2" height="2" fill="#f3d38c" />
              <rect x="5" y="23" width="6" height="1" fill="#f3d38c" opacity="0.4" />
              <rect x="3" y="24" width="10" height="2" fill="#f3d38c" opacity="0.25" />
              <rect x="1" y="26" width="14" height="3" fill="#f3d38c" opacity="0.1" />
            </svg>
          </div>

          {/* Top Right: Cafe Wall Wooden Sign */}
          <div className="fixed top-14 right-8 pointer-events-none hidden xl:block z-10 select-none">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
              <rect x="2" y="4" width="8" height="2" fill="var(--border)" />
              <rect x="2" y="6" width="2" height="6" fill="var(--border)" />
              <rect x="8" y="6" width="1" height="2" fill="#4d3227" />
              <rect x="13" y="6" width="1" height="2" fill="#4d3227" />
              <rect x="6" y="8" width="10" height="10" fill="#ab7052" />
              <rect x="7" y="9" width="8" height="8" fill="#bc8265" />
              <rect x="9" y="11" width="4" height="1" fill="#df8c8f" />
              <rect x="8" y="12" width="6" height="2" fill="#df8c8f" />
              <rect x="9" y="14" width="4" height="1" fill="#df8c8f" />
              <rect x="10" y="15" width="2" height="1" fill="#df8c8f" />
            </svg>
          </div>

          {/* Bottom Left: Wood Coffee Menu Board */}
          <div className="fixed bottom-8 left-8 pointer-events-none hidden xl:block z-10 select-none">
            <svg width="80" height="106" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
              <rect x="4" y="24" width="2" height="8" fill="var(--border)" />
              <rect x="18" y="24" width="2" height="8" fill="var(--border)" />
              <rect x="2" y="2" width="20" height="23" fill="var(--border)" />
              <rect x="4" y="4" width="16" height="19" fill="#f4ecd8" />
              
              {/* "COFFEE" Text representation */}
              <rect x="6" y="6" width="3" height="1" fill="#3d2821" />
              <rect x="6" y="7" width="1" height="2" fill="#3d2821" />
              <rect x="6" y="9" width="3" height="1" fill="#3d2821" />
              
              <rect x="10" y="6" width="3" height="1" fill="#3d2821" />
              <rect x="10" y="7" width="1" height="3" fill="#3d2821" />
              <rect x="12" y="7" width="1" height="3" fill="#3d2821" />
              <rect x="10" y="9" width="3" height="1" fill="#3d2821" />
              
              {/* lines */}
              <rect x="6" y="12" width="12" height="1" fill="#7f5139" />
              <rect x="6" y="14" width="8" height="1" fill="#7f5139" />
              <rect x="6" y="16" width="10" height="1" fill="#7f5139" />
              
              {/* Cup */}
              <rect x="13" y="19" width="4" height="3" fill="#df8c8f" />
              <rect x="17" y="20" width="1" height="1" fill="var(--border)" />
              <rect x="14" y="18" width="2" height="1" fill="#e5cda3" />
            </svg>
          </div>

          {/* Bottom Right: Cozy Sleeping Cat & Potted Matcha Tree */}
          <div className="fixed bottom-8 right-8 pointer-events-none hidden xl:block z-10 select-none flex items-end space-x-6">
            {/* Sleeping Cat on Bench */}
            <div className="flex items-end">
              <svg width="128" height="64" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
                <rect x="2" y="8" width="2" height="8" fill="var(--border)" />
                <rect x="28" y="8" width="2" height="8" fill="var(--border)" />
                <rect x="1" y="6" width="30" height="2" fill="#ab7052" />
                <rect x="1" y="6" width="30" height="1" fill="#bc8265" />
                
                {/* Cat */}
                <rect x="8" y="2" width="16" height="4" fill="#ffffff" />
                <rect x="12" y="2" width="4" height="2" fill="#e8a86a" />
                <rect x="20" y="2" width="3" height="3" fill="#e8a86a" />
                <rect x="6" y="1" width="4" height="4" fill="#ffffff" />
                <rect x="6" y="0" width="1" height="1" fill="#e8a86a" />
                <rect x="9" y="0" width="1" height="1" fill="#ffffff" />
                <rect x="24" y="3" width="3" height="1" fill="#e8a86a" />
                <rect x="25" y="4" width="1" height="2" fill="#e8a86a" />
                <rect x="5" y="3" width="1" height="1" fill="var(--border)" />
                <rect x="7" y="3" width="1" height="1" fill="var(--border)" />
              </svg>
            </div>
            
            {/* Potted Matcha Tree */}
            <div className="flex items-end">
              <svg width="64" height="85" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
                <rect x="8" y="26" width="8" height="6" fill="#e88a8f" />
                <rect x="7" y="25" width="10" height="1" fill="var(--border)" />
                <rect x="8" y="24" width="8" height="1" fill="#4d3227" />
                <rect x="11" y="16" width="2" height="8" fill="var(--border)" />
                
                <rect x="9" y="8" width="6" height="8" fill="#a5c1a7" />
                <rect x="7" y="10" width="10" height="5" fill="#a5c1a7" />
                <rect x="6" y="11" width="12" height="3" fill="#a5c1a7" />
                
                <rect x="9" y="8" width="2" height="8" fill="#c3dbc5" />
                <rect x="7" y="10" width="2" height="5" fill="#c3dbc5" />
                
                <rect x="8" y="12" width="1" height="1" fill="#f3d38c" />
                <rect x="14" y="9" width="1" height="1" fill="#f3d38c" />
                <rect x="15" y="13" width="1" height="1" fill="#f3d38c" />
              </svg>
            </div>
          </div>
        </>
      )}
      
      {children}
    </div>
  );
}
