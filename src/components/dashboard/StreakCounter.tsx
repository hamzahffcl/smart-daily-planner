"use client";

import { usePlannerStore } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Flame } from "lucide-react";

export default function StreakCounter() {
  const streak = usePlannerStore((state) => state.streak);
  const { t } = useLanguageStore();

  // Determine motivational text and intensity of styling based on streak count
  const getMotivationalText = (count: number) => {
    if (count === 0) return t('dashboard.streakCounter.msg0');
    if (count < 3) return t('dashboard.streakCounter.msg1');
    if (count < 7) return t('dashboard.streakCounter.msg2');
    return t('dashboard.streakCounter.msg3');
  };

  const getFlameColorClass = (count: number) => {
    if (count === 0) return "text-muted-foreground";
    if (count < 3) return "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    if (count < 7) return "text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)] animate-pulse";
    return "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-bounce";
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card/60 backdrop-blur-md border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        {t('dashboard.streakCounter.title')}
      </h3>

      <div className="relative flex items-center justify-center mb-2">
        <div className={`p-4 bg-muted/30 rounded-full transition-all duration-300`}>
          <Flame className={`h-16 w-16 transition-all duration-500 ${getFlameColorClass(streak)}`} />
        </div>
        {streak > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce">
            {streak}d
          </span>
        )}
      </div>

      <div className="flex flex-col items-center text-center mt-2">
        <span className="text-3xl font-extrabold tracking-tight">
          {streak} {streak === 1 ? t('dashboard.streakCounter.day') : t('dashboard.streakCounter.days')}
        </span>
        <p className="text-xs text-muted-foreground mt-2 font-medium max-w-[180px]">
          {getMotivationalText(streak)}
        </p>
      </div>
    </div>
  );
}
