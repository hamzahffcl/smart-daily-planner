"use client";

import { usePlannerStore } from "@/store/usePlannerStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  format,
  subDays,
  parseISO,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { CheckCircle2, AlertCircle, Timer, Award } from "lucide-react";

export default function StatsPanel() {
  const tasks = usePlannerStore((state) => state.tasks);
  const pomodorosCompleted = usePlannerStore((state) => state.pomodorosCompleted);

  // 1. Calculate General Metrics
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const totalActive = tasks.length;
  const completionRate = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
  
  // Carry over rate
  const carriedTasks = tasks.filter((t) => t.carryOverCount > 0);
  const totalCarriedCount = carriedTasks.reduce((acc, curr) => acc + curr.carryOverCount, 0);

  // 2. Generate Heatmap Data (Last 12 weeks = 84 days)
  const today = new Date();
  const startDate = subDays(today, 83); // 12 weeks including today
  
  const daysInterval = eachDayOfInterval({ start: startDate, end: today });

  // Map tasks to completed counts by date
  const completedTaskDates = tasks
    .filter((t) => t.completed && t.completedAt)
    .map((t) => format(parseISO(t.completedAt!), "yyyy-MM-dd"));

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-muted/30 dark:bg-muted/15 border-muted/10";
    if (count === 1) return "bg-primary/20 border-primary/20";
    if (count === 2) return "bg-primary/50 border-primary/35";
    return "bg-primary border-primary/50 drop-shadow-[0_0_2px_rgba(var(--primary),0.3)]";
  };

  const getCountForDate = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    return completedTaskDates.filter((d) => d === formatted).length;
  };

  // Group days by week (Sunday to Saturday) for vertical columns
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Align start to the start of the week of startDate
  const startAlign = startOfWeek(startDate);
  const endAlign = endOfWeek(today);
  const alignInterval = eachDayOfInterval({ start: startAlign, end: endAlign });

  alignInterval.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // 3. 7-Day Completion Bar Chart (SVG-based)
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const chartData = last7Days.map((day) => {
    const formatted = format(day, "yyyy-MM-dd");
    const count = completedTaskDates.filter((d) => d === formatted).length;
    return {
      label: format(day, "EEE"),
      date: format(day, "d MMM"),
      count,
    };
  });

  const maxCount = Math.max(...chartData.map((d) => d.count), 4); // minimum ceiling of 4 for chart scaling
  const chartHeight = 140;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Performance Statistics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your completion rates, consistencies, and focus sessions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Completed Tasks
              </span>
              <span className="text-2xl font-extrabold tracking-tight">
                {totalCompleted}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Completion Rate
              </span>
              <span className="text-2xl font-extrabold tracking-tight">
                {completionRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-500 shrink-0">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Focus Sessions
              </span>
              <span className="text-2xl font-extrabold tracking-tight">
                {pomodorosCompleted}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Carry Overs
              </span>
              <span className="text-2xl font-extrabold tracking-tight">
                {totalCarriedCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Heatmap Widget (takes 2 cols on md) */}
        <Card className="bg-card/60 backdrop-blur-md border md:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-6">
              Activity Heatmap (Last 12 Weeks)
            </h3>
            
            <div className="flex flex-col items-center overflow-x-auto w-full pb-2">
              <div className="flex gap-[4px] select-none min-w-[320px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[4px]">
                    {week.map((day, dIdx) => {
                      const count = getCountForDate(day);
                      // Skip if date is out of our 12-week range (just for aesthetic alignment)
                      const isOutOfRange = day < startDate || day > today;
                      
                      return (
                        <div
                          key={dIdx}
                          title={`${format(day, "EEEE, d MMM yyyy")}: ${count} task(s) completed`}
                          className={`h-4 w-4 rounded-[3px] border transition-all duration-300 ${
                            isOutOfRange
                              ? "bg-transparent border-transparent pointer-events-none"
                              : getHeatmapColor(count)
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div className="flex justify-end items-center space-x-2 w-full mt-4 text-[10px] font-medium text-muted-foreground pr-4">
                <span>Less</span>
                <div className="h-3 w-3 rounded-[2px] bg-muted/30 border border-muted/10" />
                <div className="h-3 w-3 rounded-[2px] bg-primary/20 border border-primary/20" />
                <div className="h-3 w-3 rounded-[2px] bg-primary/50 border border-primary/35" />
                <div className="h-3 w-3 rounded-[2px] bg-primary border border-primary/50" />
                <span>More</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Completion Bar Chart */}
        <Card className="bg-card/60 backdrop-blur-md border">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-6">
              Weekly Completion History
            </h3>
            
            {/* SVG Bar Chart */}
            <div className="relative flex flex-col justify-end w-full" style={{ height: `${chartHeight}px` }}>
              <div className="flex justify-between items-end w-full h-full px-2 border-b border-muted">
                {chartData.map((data, idx) => {
                  const percentageHeight = (data.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      {/* Tooltip on hover */}
                      <span className="absolute -top-6 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-mono font-bold opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-sm">
                        {data.count}
                      </span>
                      
                      {/* Bar */}
                      <div
                        className="bg-primary/80 group-hover:bg-primary w-8 md:w-6 rounded-t-md transition-all duration-500 ease-out"
                        style={{ height: `${percentageHeight}%`, minHeight: data.count > 0 ? "4px" : "0px" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Labels Underneath */}
            <div className="flex justify-between w-full mt-2 px-2 text-[10px] font-bold text-muted-foreground">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 text-center font-sans">
                  <span>{data.label}</span>
                  <span className="text-[8px] font-normal text-muted-foreground/75 mt-0.5">{data.date.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
