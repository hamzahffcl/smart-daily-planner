"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";

export default function RealTimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const { t } = useLanguageStore();

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground animate-pulse">
        <Clock className="h-5 w-5" />
        <span className="text-sm font-medium">{t('dashboard.clock.loading')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start md:items-end">
      <div className="flex items-center space-x-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </div>
        <span className="text-2xl font-bold tracking-tight font-mono tabular-nums">
          {format(time, "HH:mm:ss")}
        </span>
      </div>
      <span className="text-xs text-muted-foreground font-medium mt-0.5">
        {format(time, "EEEE, d MMMM yyyy")}
      </span>
    </div>
  );
}
