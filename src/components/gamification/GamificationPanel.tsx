"use client";

import { usePlannerStore } from "@/store/usePlannerStore";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Award,
  Timer,
  Brain,
  Flame,
  Sparkles,
  Zap,
  TrendingUp,
  Lock,
  Unlock,
} from "lucide-react";

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

const ACHIEVEMENTS_LIST: AchievementDef[] = [
  { id: "first-step", title: "First Step", description: "Complete your first task", iconName: "first-step" },
  { id: "task-master", title: "Task Master", description: "Complete 10 tasks", iconName: "task-master" },
  { id: "pomodoro-pioneer", title: "Focus Pioneer", description: "Complete 1 Pomodoro session", iconName: "pomodoro-pioneer" },
  { id: "focus-guru", title: "Focus Guru", description: "Complete 10 Pomodoro sessions", iconName: "focus-guru" },
  { id: "streak-starter", title: "Streak Starter", description: "Reach a 3-day streak", iconName: "streak-starter" },
  { id: "streak-legend", title: "Streak Legend", description: "Reach a 7-day streak", iconName: "streak-legend" },
  { id: "high-priority", title: "Anti-Procrastinator", description: "Complete a High priority task", iconName: "high-priority" },
  { id: "level-up", title: "Next Level", description: "Reach Level 2", iconName: "level-up" },
];

export default function GamificationPanel() {
  const xp = usePlannerStore((state) => state.xp);
  const level = usePlannerStore((state) => state.level);
  const unlockedAchievements = usePlannerStore((state) => state.unlockedAchievements);

  const xpNeeded = level * 100;
  const xpPercentage = Math.min(100, Math.round((xp / xpNeeded) * 100));

  const getIcon = (iconName: string, isUnlocked: boolean) => {
    const size = "h-7 w-7";
    const color = isUnlocked ? "text-primary" : "text-muted-foreground/60";

    switch (iconName) {
      case "first-step":
        return <CheckCircle2 className={`${size} ${color}`} />;
      case "task-master":
        return <Award className={`${size} ${color}`} />;
      case "pomodoro-pioneer":
        return <Timer className={`${size} ${color}`} />;
      case "focus-guru":
        return <Brain className={`${size} ${color}`} />;
      case "streak-starter":
        return <Flame className={`${size} ${color}`} />;
      case "streak-legend":
        return <Sparkles className={`${size} ${color}`} />;
      case "high-priority":
        return <Zap className={`${size} ${color}`} />;
      case "level-up":
        return <TrendingUp className={`${size} ${color}`} />;
      default:
        return <Award className={`${size} ${color}`} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Level & Achievements</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Unlock achievements and level up by completing tasks and focusing
        </p>
      </div>

      {/* Level Card */}
      <Card className="bg-card/60 backdrop-blur-md border relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 font-bold text-8xl pointer-events-none select-none font-mono">
          Lvl {level}
        </div>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-2xl shadow-md border border-primary/20">
              {level}
            </div>
            <div>
              <h3 className="text-lg font-bold">Level {level} Planner</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Keep completes going to rank up your productivity level!
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full space-y-2">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className="text-muted-foreground">Progression</span>
              <span>
                {xp} / {xpNeeded} XP ({xpPercentage}%)
              </span>
            </div>
            <Progress value={xpPercentage} className="h-3" />
            <p className="text-[10px] text-muted-foreground/80 font-medium">
              You need <span className="font-bold text-foreground">{xpNeeded - xp} XP</span> more to reach Level {level + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-md font-bold tracking-tight">
            Achievements ({unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length})
          </h3>
          <span className="text-xs font-semibold text-muted-foreground">
            Complete milestones to unlock badges
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ACHIEVEMENTS_LIST.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);

            return (
              <Card
                key={achievement.id}
                className={`overflow-hidden transition-all duration-300 ${
                  isUnlocked
                    ? "bg-card border-primary/30 shadow-sm hover:shadow-md"
                    : "bg-muted/10 border-muted opacity-60 hover:opacity-75"
                }`}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-3.5 relative">
                  {/* Status Indicator */}
                  <div className="absolute top-2 right-2">
                    {isUnlocked ? (
                      <Unlock className="h-3 w-3 text-primary" />
                    ) : (
                      <Lock className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`p-3 rounded-2xl ${isUnlocked ? "bg-primary/10" : "bg-muted/30"}`}>
                    {getIcon(achievement.iconName, isUnlocked)}
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h4 className={`text-sm font-bold tracking-tight ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      {achievement.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-[160px] mx-auto">
                      {achievement.description}
                    </p>
                  </div>

                  {/* Unlock badge */}
                  {isUnlocked ? (
                    <Badge className="text-[9px] font-bold py-0.5 px-2 bg-primary/15 text-primary hover:bg-primary/20 border border-primary/20">
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 text-muted-foreground/60">
                      Locked
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
