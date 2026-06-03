"use client";

import { usePlannerStore } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useThemeStore } from "@/store/useThemeStore";
import { format } from "date-fns";

export default function ProgressCircle() {
  const tasks = usePlannerStore((state) => state.tasks);
  const { t } = useLanguageStore();
  const themeColor = useThemeStore((state) => state.themeColor);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);

  const total = todayTasks.length;
  const completed = completedTodayTasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // SVG parameters
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-6 transition-all duration-300 ${
      themeColor === "cozy-pixel" 
        ? "pixel-box bg-card" 
        : "glass-panel shadow-sm hover:shadow-md hover:scale-[1.01]"
    }`}>
      <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 ${
        themeColor === "cozy-pixel" ? "font-pixel-heavy" : ""
      }`}>
        {t('dashboard.progress.title')}
      </h3>
      
      <div className="relative flex items-center justify-center h-36 w-36">
        {/* SVG Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="progressGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-muted"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="url(#progressGrad)"
            filter={themeColor !== "cozy-pixel" ? "url(#progressGlow)" : undefined}
            className="transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap={themeColor === "cozy-pixel" ? "square" : "round"}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-extrabold tracking-tight ${themeColor === "cozy-pixel" ? "font-pixel-heavy mt-2 text-2xl" : "font-sans"}`}>
            {percentage}%
          </span>
          <span className={`text-[10px] font-semibold text-muted-foreground uppercase mt-0.5 ${themeColor === "cozy-pixel" ? "font-pixel" : ""}`}>
            {t('dashboard.progress.completed')}
          </span>
        </div>
      </div>

      <p className="text-sm text-center text-muted-foreground mt-4 font-medium">
        {total > 0 ? (
          <span dangerouslySetInnerHTML={{ 
            __html: t('dashboard.progress.status', { completed, total }).replace(String(completed), `<span class="text-foreground font-bold">${completed}</span>`).replace(String(total), `<span class="text-foreground font-bold">${total}</span>`) 
          }} />
        ) : (
          t('dashboard.progress.noTasks')
        )}
      </p>
    </div>
  );
}
