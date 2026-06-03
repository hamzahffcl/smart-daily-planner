"use client";

import React, { useState, useEffect } from "react";
import { usePlannerStore, Task } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Language } from "@/lib/i18n/translations";
import { useTheme } from "next-themes";
import { useThemeStore, ThemeColor, ThemeTexture } from "@/store/useThemeStore";
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
  const { t, language, setLanguage } = useLanguageStore();
  const runDailyMaintenance = usePlannerStore((state) => state.runDailyMaintenance);
  const tasks = usePlannerStore((state) => state.tasks);
  const level = usePlannerStore((state) => state.level);
  const xp = usePlannerStore((state) => state.xp);
  const streak = usePlannerStore((state) => state.streak);
  const importData = usePlannerStore((state) => state.importData);
  const resetAllData = usePlannerStore((state) => state.resetAllData);

  const themeColor = useThemeStore((state) => state.themeColor);
  const setThemeColor = useThemeStore((state) => state.setThemeColor);
  const themeTexture = useThemeStore((state) => state.themeTexture);
  const setThemeTexture = useThemeStore((state) => state.setThemeTexture);

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
  const [selectedFileName, setSelectedFileName] = useState<string>("");
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
    const files = e.target.files;
    if (!files || files.length === 0) {
      setSelectedFileName("");
      return;
    }
    setSelectedFileName(files[0].name);

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const success = importData(result);
        if (success) {
          setImportStatus({ type: "success", message: t('settings.importSuccess') });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setImportStatus({ type: "error", message: t('settings.importError') });
        }
      }
    };
    fileReader.readAsText(files[0]);
  };

  const handleResetData = () => {
    if (confirm(t('settings.resetConfirm'))) {
      resetAllData();
      window.location.reload();
    }
  };

  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));

  const getTodayLabel = () => {
    try {
      const localeMap: Record<string, string> = {
        en: "en-US",
        id: "id-ID",
        ja: "ja-JP",
        ar: "ar-EG",
        zh: "zh-CN",
        ko: "ko-KR",
      };
      return new Intl.DateTimeFormat(localeMap[language] || "en-US", { weekday: "long", day: "numeric", month: "short" }).format(new Date());
    } catch (e) {
      return format(new Date(), "eeee, d MMM");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Background gradients for premium glassmorphic effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary),transparent_40%)] opacity-[0.08] dark:opacity-[0.12] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.55_0.18_260),transparent_45%)] opacity-[0.05] dark:opacity-[0.08] pointer-events-none -z-10" />

      {/* Outer Shell Wrapper */}
      <div className="max-w-6xl w-full mx-auto p-4 md:p-8 flex-1 flex flex-col space-y-6">
        
        {/* APP HEADER */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 md:py-4 transition-all duration-300 ${
          themeColor === "cozy-pixel" ? "pixel-box bg-card" : "glass-panel neon-glow rounded-3xl shadow-sm"
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`h-10 w-10 bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-md border ${
              themeColor === "cozy-pixel" ? "border-2 border-primary-foreground rounded-none font-pixel-heavy" : "rounded-2xl border-primary/20"
            }`}>
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`text-lg font-extrabold tracking-tight ${themeColor === "cozy-pixel" ? "font-pixel-heavy" : ""}`}>{t('app.title')}</h1>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              
              {/* Header XP bar */}
              <div className="flex items-center space-x-3 mt-1.5">
                <Badge variant="outline" className={`text-[10px] font-bold py-0.5 px-2 bg-primary/10 text-primary border-primary/20 ${
                  themeColor === "cozy-pixel" ? "rounded-none border-2 border-primary" : "rounded-full"
                }`}>
                  {t('app.level')} {level}
                </Badge>
                <div className={`w-32 bg-muted h-2 overflow-hidden shadow-inner ${
                  themeColor === "cozy-pixel" ? "rounded-none border border-primary" : "rounded-full"
                }`}>
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  {xp} / {xpNeeded} {t('app.xp')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-0 pt-3 md:pt-0">
            {/* Real-time Clock */}
            <RealTimeClock />

            {/* Language Selector */}
            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger className="h-10 w-[125px] rounded-full border-muted text-xs font-semibold" aria-label={t('lang.toggle')}>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="id">🇮🇩 Indonesia</SelectItem>
                <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                <SelectItem value="zh">🇨🇳 中文</SelectItem>
                <SelectItem value="ko">🇰🇷 한국어</SelectItem>
              </SelectContent>
            </Select>

            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`h-10 w-10 shrink-0 border-muted ${themeColor === "cozy-pixel" ? "pixel-btn bg-card" : "rounded-full"}`}
              title={t('theme.toggle')}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
              <span className="sr-only">{t('theme.toggle')}</span>
            </Button>
          </div>
        </header>

        {/* TABS CONTAINER */}
        <Tabs defaultValue="dashboard" className="flex-1 flex flex-col space-y-6">
          <div className="w-full overflow-x-auto pb-2 -mb-2 hide-scrollbar">
            <TabsList className={`inline-flex h-auto p-1.5 w-max min-w-full md:min-w-0 transition-all duration-300 ${
              themeColor === "cozy-pixel" ? "pixel-box bg-card" : "glass-panel rounded-full"
            }`}>
              <TabsTrigger value="dashboard" className={`flex items-center justify-center gap-2 text-sm font-semibold py-2 px-5 whitespace-nowrap transition-all flex-1 md:flex-none ${
                themeColor === "cozy-pixel" ? "rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-pixel" : "rounded-full"
              }`}>
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>{t('tabs.dashboard')}</span>
              </TabsTrigger>
              <TabsTrigger value="focus" className={`flex items-center justify-center gap-2 text-sm font-semibold py-2 px-5 whitespace-nowrap transition-all flex-1 md:flex-none ${
                themeColor === "cozy-pixel" ? "rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-pixel" : "rounded-full"
              }`}>
                <Timer className="h-4 w-4 shrink-0" />
                <span>{t('tabs.focus')}</span>
              </TabsTrigger>
              <TabsTrigger value="routines" className={`flex items-center justify-center gap-2 text-sm font-semibold py-2 px-5 whitespace-nowrap transition-all flex-1 md:flex-none ${
                themeColor === "cozy-pixel" ? "rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-pixel" : "rounded-full"
              }`}>
                <RefreshCw className="h-4 w-4 shrink-0" />
                <span>{t('tabs.routines')}</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className={`flex items-center justify-center gap-2 text-sm font-semibold py-2 px-5 whitespace-nowrap transition-all flex-1 md:flex-none ${
                themeColor === "cozy-pixel" ? "rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-pixel" : "rounded-full"
              }`}>
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>{t('tabs.stats')}</span>
              </TabsTrigger>
              <TabsTrigger value="gamification" className={`flex items-center justify-center gap-2 text-sm font-semibold py-2 px-5 whitespace-nowrap transition-all flex-1 md:flex-none ${
                themeColor === "cozy-pixel" ? "rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-pixel" : "rounded-full"
              }`}>
                <Award className="h-4 w-4 shrink-0" />
                <span>{t('tabs.rankings')}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className={`flex items-center justify-center gap-2 text-sm font-semibold py-2 px-5 whitespace-nowrap transition-all flex-1 md:flex-none ${
                themeColor === "cozy-pixel" ? "rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-pixel" : "rounded-full"
              }`}>
                <SettingsIcon className="h-4 w-4 shrink-0" />
                <span>{t('tabs.settings')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
                    {t('dashboard.dailyFocus')}
                  </h3>
                  <p className="text-sm italic font-medium text-foreground/90 leading-relaxed">
                    {t('dashboard.quote')}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t pt-3 mt-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                  <span>{t('dashboard.plannerLevel', { level })}</span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {t('dashboard.streak', { streak })}
                  </span>
                </div>
              </Card>
            </div>

            {/* Task Area */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{t('dashboard.todaySchedule')}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                    {t('dashboard.tasksScheduled')} ({getTodayLabel()})
                  </p>
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('dashboard.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 w-[180px] text-xs"
                    />
                  </div>

                  {/* Priority Filter */}
                  <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "all")}>
                    <SelectTrigger className="h-9 w-[120px] text-xs font-semibold">
                      <SelectValue placeholder={t('dashboard.priority')}>
                        {priorityFilter === "all" ? t('filter.allPriority') : 
                         priorityFilter === "High" ? t('filter.high') : 
                         priorityFilter === "Medium" ? t('filter.medium') : 
                         priorityFilter === "Low" ? t('filter.low') : ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs font-medium">{t('filter.allPriority')}</SelectItem>
                      <SelectItem value="High" className="text-xs font-semibold text-destructive">{t('filter.high')}</SelectItem>
                      <SelectItem value="Medium" className="text-xs font-semibold text-amber-500">{t('filter.medium')}</SelectItem>
                      <SelectItem value="Low" className="text-xs font-semibold text-emerald-500">{t('filter.low')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                    <SelectTrigger className="h-9 w-[130px] text-xs font-semibold">
                      <SelectValue placeholder={t('dashboard.status')}>
                        {statusFilter === "all" ? t('filter.allStatus') : 
                         statusFilter === "incomplete" ? t('filter.incomplete') : 
                         statusFilter === "completed" ? t('filter.completed') : ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs font-medium">{t('filter.allStatus')}</SelectItem>
                      <SelectItem value="incomplete" className="text-xs font-semibold">{t('filter.incomplete')}</SelectItem>
                      <SelectItem value="completed" className="text-xs font-semibold">{t('filter.completed')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Create Task Button */}
                  <Button onClick={() => setIsTaskDialogOpen(true)} className="h-9 font-semibold shadow-sm text-xs">
                    <Plus className="h-4 w-4 mr-1.5" />
                    {t('dashboard.newTask')}
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
                  <p className="text-sm font-semibold text-muted-foreground">{t('dashboard.noTasks')}</p>
                  <p className="text-xs text-muted-foreground/75 mt-1">
                    {t('dashboard.noTasksHint')}
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
                <h2 className="text-xl font-bold tracking-tight">{t('settings.title')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('settings.subtitle')}
                </p>
              </div>

              <Card className={`${themeColor === "cozy-pixel" ? "pixel-box bg-card" : "glass-panel bg-card/60"}`}>
                <CardContent className="p-6 space-y-6">
                  {/* Theme Section */}
                  <div className="space-y-4 pb-6 border-b">
                    <div>
                      <label className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                        {t('settings.themeTitle')}
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {language === "id" ? "Pilih skema warna utama untuk aplikasi web dan widget." : "Select the primary color scheme for your dashboard and widgets."}
                      </p>
                    </div>
                    
                    {/* Color swatches */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { id: "violet", color: "bg-purple-600", label: "Violet" },
                        { id: "emerald", color: "bg-emerald-600", label: "Emerald" },
                        { id: "rose", color: "bg-rose-600", label: "Rose" },
                        { id: "amber", color: "bg-amber-600", label: "Amber" },
                        { id: "slate", color: "bg-slate-600", label: "Slate" },
                        { id: "cozy-pixel", color: "bg-[#d4a373]", label: "Cozy Pixel", isPixel: true }
                      ].map((item) => {
                        const isActive = themeColor === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setThemeColor(item.id as ThemeColor)}
                            className={`flex flex-col items-center justify-center p-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                              isActive 
                                ? (themeColor === "cozy-pixel" ? "border-3 border-primary bg-primary/10 shadow-sm" : "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/45 rounded-2xl border")
                                : (themeColor === "cozy-pixel" ? "border-3 border-muted bg-card/45 hover:bg-muted/10" : "border-muted bg-card/45 hover:bg-muted/10 rounded-2xl border")
                            } ${item.isPixel ? "font-pixel" : ""}`}
                          >
                            <div className={`h-6 w-6 ${item.color} mb-1.5 flex items-center justify-center text-white text-[10px] font-bold border border-white/20 shadow-inner ${
                              themeColor === "cozy-pixel" ? "rounded-none border-2 border-primary" : "rounded-full"
                            }`}>
                              {isActive && "✓"}
                            </div>
                            <span className="text-[11px] font-bold tracking-tight">
                              {item.id === "cozy-pixel" ? "Cozy Pixel" : t(`theme.${item.id}`)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Background Texture Section */}
                  <div className="space-y-4 pb-6 border-b">
                    <div>
                      <label className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                        {language === "id" ? "Tekstur & Pola Latar Belakang" : "Background Textures & Patterns"}
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {language === "id" ? "Tambahkan pola geometris atau efek gradien mesh ke latar belakang." : "Overlay geometric structures or mesh gradients to your background."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: "none", label: language === "id" ? "Tanpa Pola" : "None" },
                        { id: "mesh", label: language === "id" ? "Mesh Gradient" : "Mesh" },
                        { id: "grid", label: language === "id" ? "Kotak-Kotak" : "Grid" },
                        { id: "dots", label: language === "id" ? "Titik-Titik" : "Dots" },
                        { id: "pixel-grid", label: language === "id" ? "Pixel Retro" : "Pixel Grid", isPixel: true }
                      ].map((item) => {
                        const isActive = themeTexture === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setThemeTexture(item.id as ThemeTexture)}
                            className={`flex flex-col items-center justify-center p-2 text-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                              isActive 
                                ? (themeColor === "cozy-pixel" ? "border-3 border-primary bg-primary/10 shadow-sm" : "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/45 rounded-2xl border")
                                : (themeColor === "cozy-pixel" ? "border-3 border-muted bg-card/45 hover:bg-muted/10" : "border-muted bg-card/45 hover:bg-muted/10 rounded-2xl border")
                            } ${item.isPixel || themeColor === "cozy-pixel" ? "font-pixel" : ""}`}
                          >
                            <span className="text-[11px] font-bold tracking-tight py-1">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Backup Section */}
                  <div className="space-y-3 pb-6 border-b">
                    <h3 className="text-sm font-bold tracking-tight">{t('settings.export')}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('settings.exportDesc')}
                    </p>
                    <Button onClick={handleExportData} className="w-full sm:w-auto font-semibold">
                      <Download className="h-4 w-4 mr-2" />
                      {t('settings.downloadBtn')}
                    </Button>
                  </div>

                  {/* Restore Section */}
                  <div className="space-y-3 pb-6 border-b">
                    <h3 className="text-sm font-bold tracking-tight">{t('settings.import')}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('settings.importDesc')}
                    </p>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("file-import-input")?.click()}
                        className="font-semibold text-xs"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('settings.chooseFile')}
                      </Button>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] font-medium font-sans">
                        {selectedFileName || t('settings.noFile')}
                      </span>
                      <input
                        id="file-import-input"
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
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
                    <h3 className="text-sm font-bold tracking-tight text-destructive">{t('settings.danger')}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('settings.dangerDesc')}
                    </p>
                    <Button onClick={handleResetData} variant="destructive" className="w-full sm:w-auto font-semibold">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('settings.resetBtn')}
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
