import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  format,
  isBefore,
  isToday,
  startOfDay,
  parseISO,
  differenceInCalendarDays,
  isYesterday,
} from "date-fns";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string; // ISO string
  tags: string[];
  subtasks: SubTask[];
  notes: string;
  alarmTime?: string; // HH:MM
  carryOverCount: number;
  createdAt: string; // ISO string
}

export interface RecurringTemplate {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  frequency: "Daily" | "Weekly" | "Monthly";
  tags: string[];
  notes: string;
  active: boolean;
  lastGeneratedDate?: string; // YYYY-MM-DD
  createdAt: string; // ISO string
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface PlannerState {
  tasks: Task[];
  recurringTemplates: RecurringTemplate[];
  xp: number;
  level: number;
  streak: number;
  lastOpenedDate: string; // YYYY-MM-DD
  pomodorosCompleted: number;
  unlockedAchievements: string[];
  voiceAiEnabled: boolean;
  voiceAiProvider: "local" | "ollama" | "webllm";
  ollamaEndpoint: string;
  ollamaModel: string;
  webLlmModel: string;
  
  // Actions
  addTask: (task: Omit<Task, "id" | "carryOverCount" | "createdAt" | "completed">) => void;
  updateTask: (id: string, updatedFields: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  updateVoiceSettings: (settings: Partial<{ voiceAiEnabled: boolean; voiceAiProvider: "local" | "ollama" | "webllm"; ollamaEndpoint: string; ollamaModel: string; webLlmModel: string }>) => void;
  
  // Recurring Templates
  addRecurringTemplate: (template: Omit<RecurringTemplate, "id" | "createdAt" | "active">) => void;
  updateRecurringTemplate: (id: string, updatedFields: Partial<RecurringTemplate>) => void;
  deleteRecurringTemplate: (id: string) => void;
  
  // Pomodoro Focus
  completePomodoro: () => void;
  
  // Maintenance Engine
  runDailyMaintenance: () => void;
  
  // Gamification & Achievements
  addXp: (amount: number) => void;
  
  // Export/Import
  importData: (data: string) => boolean;
  resetAllData: () => void;
}

const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: "first-step", title: "First Step", description: "Complete your first task", icon: "CheckCircle" },
  { id: "task-master", title: "Task Master", description: "Complete 10 tasks", icon: "Award" },
  { id: "pomodoro-pioneer", title: "Focus Pioneer", description: "Complete 1 Pomodoro session", icon: "Timer" },
  { id: "focus-guru", title: "Focus Guru", description: "Complete 10 Pomodoro sessions", icon: "Brain" },
  { id: "streak-starter", title: "Streak Starter", description: "Reach a 3-day streak", icon: "Flame" },
  { id: "streak-legend", title: "Streak Legend", description: "Reach a 7-day streak", icon: "Sparkles" },
  { id: "high-priority", title: "Anti-Procrastinator", description: "Complete a High priority task", icon: "Zap" },
  { id: "level-up", title: "Next Level", description: "Reach Level 2", icon: "TrendingUp" },
];

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: [],
      recurringTemplates: [],
      xp: 0,
      level: 1,
      streak: 0,
      lastOpenedDate: format(new Date(), "yyyy-MM-dd"),
      pomodorosCompleted: 0,
      unlockedAchievements: [],
      voiceAiEnabled: false,
      voiceAiProvider: "local",
      ollamaEndpoint: "http://localhost:11434",
      ollamaModel: "qwen2.5:0.5b",
      webLlmModel: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: Math.random().toString(36).substring(2, 9),
          completed: false,
          carryOverCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      updateTask: (id, updatedFields) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const isNowCompleted = !task.completed;
        const taskPriority = task.priority;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: isNowCompleted,
                  completedAt: isNowCompleted ? new Date().toISOString() : undefined,
                }
              : t
          ),
        }));

        // XP logic
        let xpGained = 0;
        if (isNowCompleted) {
          xpGained = taskPriority === "High" ? 15 : taskPriority === "Medium" ? 10 : 8;
        } else {
          xpGained = -(taskPriority === "High" ? 15 : taskPriority === "Medium" ? 10 : 8);
        }

        // Award XP
        get().addXp(xpGained);

        // Check Achievements
        const state = get();
        const completedTasksCount = state.tasks.filter((t) => t.completed).length;
        const newAchievements: string[] = [];

        if (isNowCompleted) {
          if (completedTasksCount >= 1 && !state.unlockedAchievements.includes("first-step")) {
            newAchievements.push("first-step");
          }
          if (completedTasksCount >= 10 && !state.unlockedAchievements.includes("task-master")) {
            newAchievements.push("task-master");
          }
          if (taskPriority === "High" && !state.unlockedAchievements.includes("high-priority")) {
            newAchievements.push("high-priority");
          }
        }

        if (newAchievements.length > 0) {
          set((s) => ({
            unlockedAchievements: [...s.unlockedAchievements, ...newAchievements],
          }));
        }

        // Recalculate streak
        get().runDailyMaintenance();
      },

      toggleSubtask: (taskId, subtaskId) => {
        let xpGained = 0;
        set((state) => {
          const updatedTasks = state.tasks.map((t) => {
            if (t.id === taskId) {
              const updatedSubtasks = t.subtasks.map((st) => {
                if (st.id === subtaskId) {
                  const isNowCompleted = !st.completed;
                  xpGained = isNowCompleted ? 2 : -2;
                  return { ...st, completed: isNowCompleted };
                }
                return st;
              });
              return { ...t, subtasks: updatedSubtasks };
            }
            return t;
          });
          return { tasks: updatedTasks };
        });

        get().addXp(xpGained);
      },

      updateVoiceSettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings,
        }));
      },

      addRecurringTemplate: (templateData) => {
        const newTemplate: RecurringTemplate = {
          ...templateData,
          id: Math.random().toString(36).substring(2, 9),
          active: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          recurringTemplates: [newTemplate, ...state.recurringTemplates],
        }));
      },

      updateRecurringTemplate: (id, updatedFields) => {
        set((state) => ({
          recurringTemplates: state.recurringTemplates.map((rt) =>
            rt.id === id ? { ...rt, ...updatedFields } : rt
          ),
        }));
      },

      deleteRecurringTemplate: (id) => {
        set((state) => ({
          recurringTemplates: state.recurringTemplates.filter((rt) => rt.id !== id),
        }));
      },

      completePomodoro: () => {
        set((state) => {
          const count = state.pomodorosCompleted + 1;
          const newAchievements: string[] = [];

          if (count >= 1 && !state.unlockedAchievements.includes("pomodoro-pioneer")) {
            newAchievements.push("pomodoro-pioneer");
          }
          if (count >= 10 && !state.unlockedAchievements.includes("focus-guru")) {
            newAchievements.push("focus-guru");
          }

          return {
            pomodorosCompleted: count,
            unlockedAchievements: [...state.unlockedAchievements, ...newAchievements],
          };
        });

        get().addXp(20);
      },

      addXp: (amount) => {
        set((state) => {
          let newXp = Math.max(0, state.xp + amount);
          let newLevel = state.level;
          const newAchievements: string[] = [];

          // Level up formula: 100 XP per level
          const xpNeeded = newLevel * 100;
          if (newXp >= xpNeeded) {
            newXp = newXp - xpNeeded;
            newLevel += 1;
            
            if (newLevel >= 2 && !state.unlockedAchievements.includes("level-up")) {
              newAchievements.push("level-up");
            }
          }

          return {
            xp: newXp,
            level: newLevel,
            unlockedAchievements: [...state.unlockedAchievements, ...newAchievements],
          };
        });
      },

      runDailyMaintenance: () => {
        const today = new Date();
        const todayStr = format(today, "yyyy-MM-dd");
        const state = get();

        // 1. Process Carry Over & Recurring tasks only if we've transition to a new day
        const isNewDay = state.lastOpenedDate !== todayStr;
        
        let updatedTasks = [...state.tasks];
        let updatedTemplates = [...state.recurringTemplates];

        if (isNewDay) {
          // Carry Over: Move incomplete past tasks to today
          updatedTasks = updatedTasks.map((task) => {
            const isPastTask = !task.completed && task.dueDate < todayStr;
            if (isPastTask) {
              return {
                ...task,
                dueDate: todayStr,
                carryOverCount: task.carryOverCount + 1,
              };
            }
            return task;
          });

          // Generate Recurring Tasks
          updatedTemplates.forEach((template) => {
            if (!template.active) return;

            let shouldGenerate = false;
            const lastGen = template.lastGeneratedDate;

            if (!lastGen) {
              shouldGenerate = true;
            } else {
              const diffDays = differenceInCalendarDays(today, parseISO(lastGen));
              
              if (template.frequency === "Daily" && diffDays >= 1) {
                shouldGenerate = true;
              } else if (template.frequency === "Weekly" && diffDays >= 7) {
                shouldGenerate = true;
              } else if (template.frequency === "Monthly" && diffDays >= 30) { // simplified month
                shouldGenerate = true;
              }
            }

            if (shouldGenerate) {
              // Create new task from template
              const newTask: Task = {
                id: Math.random().toString(36).substring(2, 9),
                title: template.title,
                priority: template.priority,
                dueDate: todayStr,
                completed: false,
                tags: template.tags,
                subtasks: [],
                notes: template.notes,
                carryOverCount: 0,
                createdAt: new Date().toISOString(),
              };
              updatedTasks.unshift(newTask);
              template.lastGeneratedDate = todayStr;
            }
          });
        }

        // 2. Calculate Streak
        // Streak logic:
        // A streak is maintained if at least one task is completed each day.
        // Let's analyze all task completion dates.
        const completedDatesSet = new Set(
          updatedTasks
            .filter((t) => t.completed && t.completedAt)
            .map((t) => format(parseISO(t.completedAt!), "yyyy-MM-dd"))
        );

        let calculatedStreak = 0;
        let checkDate = new Date(); // Start checking from today

        // If today has no completions, check if yesterday had completions.
        // If yesterday also had no completions, streak is 0.
        // Otherwise, walk backwards to find consecutive completed days.
        const todayCompleted = completedDatesSet.has(format(checkDate, "yyyy-MM-dd"));
        const yesterdayCompleted = completedDatesSet.has(format(new Date(Date.now() - 86400000), "yyyy-MM-dd"));

        if (todayCompleted || yesterdayCompleted) {
          // If we completed something today, we start counting.
          // If we completed nothing today but yesterday was completed, the streak is still active, we start counting from yesterday.
          if (!todayCompleted) {
            checkDate = new Date(Date.now() - 86400000); // Start from yesterday
          }

          while (completedDatesSet.has(format(checkDate, "yyyy-MM-dd"))) {
            calculatedStreak++;
            checkDate.setDate(checkDate.getDate() - 1); // Move back 1 day
          }
        }

        // Achievements check for Streak
        const newAchievements: string[] = [];
        if (calculatedStreak >= 3 && !state.unlockedAchievements.includes("streak-starter")) {
          newAchievements.push("streak-starter");
        }
        if (calculatedStreak >= 7 && !state.unlockedAchievements.includes("streak-legend")) {
          newAchievements.push("streak-legend");
        }

        set({
          tasks: updatedTasks,
          recurringTemplates: updatedTemplates,
          streak: calculatedStreak,
          lastOpenedDate: todayStr,
          unlockedAchievements: [...state.unlockedAchievements, ...newAchievements],
        });
      },

      importData: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed.tasks) && Array.isArray(parsed.recurringTemplates)) {
            set({
              tasks: parsed.tasks,
              recurringTemplates: parsed.recurringTemplates,
              xp: typeof parsed.xp === "number" ? parsed.xp : 0,
              level: typeof parsed.level === "number" ? parsed.level : 1,
              streak: typeof parsed.streak === "number" ? parsed.streak : 0,
              pomodorosCompleted: typeof parsed.pomodorosCompleted === "number" ? parsed.pomodorosCompleted : 0,
              unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
              lastOpenedDate: typeof parsed.lastOpenedDate === "string" ? parsed.lastOpenedDate : format(new Date(), "yyyy-MM-dd"),
            });
            return true;
          }
          return false;
        } catch (e) {
          return false;
        }
      },

      resetAllData: () => {
        set({
          tasks: [],
          recurringTemplates: [],
          xp: 0,
          level: 1,
          streak: 0,
          pomodorosCompleted: 0,
          unlockedAchievements: [],
          lastOpenedDate: format(new Date(), "yyyy-MM-dd"),
        });
      },
    }),
    {
      name: "smart-planner-storage",
    }
  )
);
