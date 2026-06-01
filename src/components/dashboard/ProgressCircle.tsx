"use client";

import { usePlannerStore } from "@/store/usePlannerStore";
import { format } from "date-fns";

export default function ProgressCircle() {
  const tasks = usePlannerStore((state) => state.tasks);
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
    <div className="flex flex-col items-center justify-center p-6 bg-card/60 backdrop-blur-md border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Daily Progress
      </h3>
      
      <div className="relative flex items-center justify-center h-36 w-36">
        {/* SVG Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
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
            className="stroke-primary transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight font-sans">
            {percentage}%
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">
            Completed
          </span>
        </div>
      </div>

      <p className="text-sm text-center text-muted-foreground mt-4 font-medium">
        {total > 0 ? (
          <>
            Completed <span className="text-foreground font-bold">{completed}</span> of{" "}
            <span className="text-foreground font-bold">{total}</span> tasks today
          </>
        ) : (
          "No tasks scheduled for today"
        )}
      </p>
    </div>
  );
}
