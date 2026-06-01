"use client";

import React, { useState, useEffect } from "react";
import { usePlannerStore, Task } from "@/store/usePlannerStore";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sun,
  Moon,
  Plus,
  Search,
  LayoutDashboard,
  Timer,
  RefreshCw,
  BarChart3,
  Award,
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Flame,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";

// Component imports
import RealTimeClock from "@/components/dashboard/RealTimeClock";
import ProgressCircle from "@/components/dashboard/ProgressCircle";
import StreakCounter from "@/components/dashboard/StreakCounter";
import TaskItem from "@/components/tasks/TaskItem";
import TaskDialog from "@/components/tasks/TaskDialog";
import RecurringTaskPanel from "@/components/tasks/RecurringTaskPanel";
import PomodoroTimer from "@/components/focus/PomodoroTimer";
import StatsPanel from "@/components/statistics/StatsPanel";
import GamificationPanel from "@/components/gamification/GamificationPanel";

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const runDailyMaintenance = usePlannerStore((state) => state.runDailyMaintenance);
  const tasks = usePlannerStore((state) => state.tasks);
  const level = usePlannerStore((state) => state.level);
  const xp = usePlannerStore((state) => state.xp);
  const streak = usePlannerStore((state) => state.streak);
  const importData = usePlannerStore((state) => state.importData);
  const resetAllData = usePlannerStore((state) => state.resetAllData);

  // Run daily carry-overs and template generation once on load
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    runDailyMaintenance();
  }, []);

  // Task creation/editing state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("incomplete");

  // Settings: Import/Export variables
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  if (!mounted) return null;

  // Filter tasks based on today and search filters
  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  const filteredTasks = tasks.filter((task) => {
    // 1. Only show tasks assigned for today (or carry overs which are automatically moved to today)
    const isForToday = task.dueDate === todayStr;
    if (!isForToday) return false;

    // 2. Search query filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // 3. Priority filter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    // 4. Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && task.completed) ||
      (statusFilter === "incomplete" && !task.completed);

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Export state to JSON file download
  const handleExportData = () => {
    const state = usePlannerStore.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `smart-planner-backup-${format(new Date(), "yyyy-MM-dd")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import state from JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const success = importData(result);
        if (success) {
          setImportStatus({ type: "success", message: "Data imported successfully! Page reloading..." });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setImportStatus({ type: "error", message: "Failed to import. Please check file format." });
        }
      }
    };
    fileReader.readAsText(files[0]);
  };

  const handleResetData = () => {
    if (confirm("Are you absolutely sure you want to reset all tasks, routines, stats and achievements? This cannot be undone.")) {
      resetAllData();
      window.location.reload();
    }
  };

  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Background gradients for premium glassmorphic effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary),transparent_40%)] opacity-[0.08] dark:opacity-[0.12] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.55_0.18_260),transparent_45%)] opacity-[0.05] dark:opacity-[0.08] pointer-events-none -z-10" />

      {/* Outer Shell Wrapper */}
      <div className="max-w-6xl w-full mx-auto p-4 md:p-8 flex-1 flex flex-col space-y-6">
        
        {/* APP HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/45 backdrop-blur-md border p-4 md:px-6 md:py-4 rounded-3xl shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-md border border-primary/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-extrabold tracking-tight">Smart Daily Planner</h1>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              
              {/* Header XP bar */}
              <div className="flex items-center space-x-2 mt-1 min-w-[180px]">
                <Badge variant="outline" className="text-[9px] font-bold py-0 px-1 bg-primary/10 text-primary">
                  Lvl {level}
                </Badge>
                <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground font-mono">
                  {xp}/{xpNeeded} XP
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-0 pt-3 md:pt-0">
            {/* Real-time Clock */}
            <RealTimeClock />

            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 rounded-full shrink-0 border-muted"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        {/* TABS CONTAINER */}
        <Tabs defaultValue="dashboard" className="flex-1 flex flex-col space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1.5 bg-card/45 backdrop-blur-md border rounded-2xl md:max-w-2xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <Timer className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Focus Mode</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <RefreshCw className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Routines</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <Award className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Rankings</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <SettingsIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB CONTENT: DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6 outline-none flex-1">
            {/* Top row widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProgressCircle />
              <StreakCounter />
              
              {/* Daily Quote / Mini Stats */}
              <Card className="bg-card/60 backdrop-blur-md border p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Daily Focus
                  </h3>
                  <p className="text-sm italic font-medium text-foreground/90 leading-relaxed">
                    "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort."
                  </p>
                </div>
                <div className="flex items-center justify-between border-t pt-3 mt-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                  <span>Level {level} Planner</span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {streak} Day Streak
                  </span>
                </div>
              </Card>
            </div>

            {/* Task Area */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Today's Schedule</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tasks scheduled for today ({format(new Date(), "eeee, d MMM")})
                  </p>
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 w-[180px] text-xs"
                    />
                  </div>

                  {/* Priority Filter */}
                  <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "all")}>
                    <SelectTrigger className="h-9 w-[120px] text-xs font-semibold">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs font-medium">All Priority</SelectItem>
                      <SelectItem value="High" className="text-xs font-semibold text-destructive">High</SelectItem>
                      <SelectItem value="Medium" className="text-xs font-semibold text-amber-500">Medium</SelectItem>
                      <SelectItem value="Low" className="text-xs font-semibold text-emerald-500">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                    <SelectTrigger className="h-9 w-[130px] text-xs font-semibold">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs font-medium">All Status</SelectItem>
                      <SelectItem value="incomplete" className="text-xs font-semibold">Incomplete</SelectItem>
                      <SelectItem value="completed" className="text-xs font-semibold">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Create Task Button */}
                  <Button onClick={() => setIsTaskDialogOpen(true)} className="h-9 font-semibold shadow-sm text-xs">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Task
                  </Button>
                </div>
              </div>

              {/* Task Cards Grid */}
              {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border border-dashed rounded-2xl text-center">
                  <ListTodo className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No tasks match your filter criteria</p>
                  <p className="text-xs text-muted-foreground/75 mt-1">
                    Try adjusting your search query, priority selector, or create a brand new task.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB CONTENT: FOCUS MODE */}
          <TabsContent value="focus" className="outline-none py-2">
            <PomodoroTimer />
          </TabsContent>

          {/* TAB CONTENT: ROUTINES */}
          <TabsContent value="routines" className="outline-none">
            <RecurringTaskPanel />
          </TabsContent>

          {/* TAB CONTENT: STATISTICS */}
          <TabsContent value="stats" className="outline-none">
            <StatsPanel />
          </TabsContent>

          {/* TAB CONTENT: RANKINGS/GAMIFICATION */}
          <TabsContent value="gamification" className="outline-none">
            <GamificationPanel />
          </TabsContent>

          {/* TAB CONTENT: SETTINGS */}
          <TabsContent value="settings" className="outline-none">
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Planner Settings</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Backup your planner profile or restore previous configuration
                </p>
              </div>

              <Card className="bg-card/60 backdrop-blur-md border">
                <CardContent className="p-6 space-y-6">
                  {/* Backup Section */}
                  <div className="space-y-3 pb-6 border-b">
                    <h3 className="text-sm font-bold tracking-tight">Export Data</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Download all your planner data including completed tasks, habits, streaks, level status, and achievements as a `.json` backup file.
                    </p>
                    <Button onClick={handleExportData} className="w-full sm:w-auto font-semibold">
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </Button>
                  </div>

                  {/* Restore Section */}
                  <div className="space-y-3 pb-6 border-b">
                    <h3 className="text-sm font-bold tracking-tight">Import Data</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Restore your planner profile from a previous `.json` backup file. This will overwrite all your current local planner data.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/95 cursor-pointer"
                      />
                    </div>

                    {/* Status notifications */}
                    {importStatus.type && (
                      <div className={`p-3 rounded-lg text-xs font-semibold ${
                        importStatus.type === "success" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}>
                        {importStatus.message}
                      </div>
                    )}
                  </div>

                  {/* Reset Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold tracking-tight text-destructive">Danger Zone</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Wipe all data from this device. All completed tasks, streaks, level progression, and routines will be deleted forever.
                    </p>
                    <Button onClick={handleResetData} variant="destructive" className="w-full sm:w-auto font-semibold">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Global Create Task dialog */}
      {isTaskDialogOpen && (
        <TaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
        />
      )}
    </div>
  );
}
