"use client";

import React, { useEffect, useState } from "react";
import { useLanguageStore } from "@/store/useLanguageStore";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((state) => state.language);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  const isRtl = language === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "font-sans text-right" : "font-sans text-left"}>
      {children}
    </div>
  );
}
