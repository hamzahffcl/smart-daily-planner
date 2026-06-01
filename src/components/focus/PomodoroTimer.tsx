"use client";

import { useState, useEffect, useRef } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, RotateCcw, SkipForward, Flame, BellRing } from "lucide-react";
import { format } from "date-fns";

export default function PomodoroTimer() {
  const tasks = usePlannerStore((state) => state.tasks);
  const completePomodoro = usePlannerStore((state) => state.completePomodoro);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr && !t.completed);

  // Focus Modes: 'focus' (25 mins) or 'break' (5 mins)
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  
  // Timer durations in seconds
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_TIME);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Programmatic Web Audio Synthesizer Alarm
  const playSynthesizedAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        
        // Envelope
        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + startDelay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      // Play a beautiful "ding ding ding" chime melody
      playTone(523.25, 0, 0.3); // C5
      playTone(659.25, 0.2, 0.3); // E5
      playTone(783.99, 0.4, 0.5); // G5
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by browser autoplay policy.");
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playSynthesizedAlarm();

    if (mode === "focus") {
      completePomodoro(); // Award XP & record statistics
      setMode("break");
      setSecondsLeft(BREAK_TIME);
    } else {
      setMode("focus");
      setSecondsLeft(FOCUS_TIME);
    }
  };

  const toggleStart = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(mode === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  const skipSession = () => {
    setIsActive(false);
    if (mode === "focus") {
      setMode("break");
      setSecondsLeft(BREAK_TIME);
    } else {
      setMode("focus");
      setSecondsLeft(FOCUS_TIME);
    }
  };

  // SVG parameters for circular countdown
  const totalDuration = mode === "focus" ? FOCUS_TIME : BREAK_TIME;
  const radius = 90;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / totalDuration) * circumference;

  const minutesStr = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secondsStr = (secondsLeft % 60).toString().padStart(2, "0");

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Focus Mode</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Stay focused with Pomodoro and earn XP for your attention
        </p>
      </div>

      {/* Task Selector */}
      <Card className="w-full bg-card/60 backdrop-blur-md border">
        <CardContent className="p-4 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Bind Focus to Today's Task
          </label>
          <Select value={selectedTaskId} onValueChange={(val) => setSelectedTaskId(val || "")}>
            <SelectTrigger className="w-full font-medium">
              <SelectValue placeholder="Select a task to focus on..." />
            </SelectTrigger>
            <SelectContent>
              {todayTasks.length > 0 ? (
                todayTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} ({t.priority} Prio)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No tasks left today!
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {selectedTask && (
            <div className="text-xs font-semibold text-primary/80 flex items-center gap-1.5 pl-1">
              <Flame className="h-3.5 w-3.5" />
              Focusing on: <span className="underline">{selectedTask.title}</span> (+20 XP on completion)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Countdown Card */}
      <Card className="w-full bg-card/60 backdrop-blur-md border flex flex-col items-center justify-center p-8 shadow-sm">
        <CardContent className="flex flex-col items-center p-0 w-full">
          {/* Visual Indicator */}
          <div className="text-sm font-semibold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            {mode === "focus" ? "Focus Session" : "Short Break"}
          </div>

          {/* SVG Countdown */}
          <div className="relative flex items-center justify-center h-52 w-52 mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-muted"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-primary transition-all duration-300"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-4xl font-extrabold tracking-tight font-mono tabular-nums">
                {minutesStr}:{secondsStr}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                {mode === "focus" ? "Work Time" : "Break Time"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="h-10 w-10 rounded-full border-muted-foreground/20"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>

            <Button
              size="lg"
              onClick={toggleStart}
              className="h-14 px-8 rounded-full font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-base"
            >
              {isActive ? (
                <>
                  <Pause className="h-5 w-5 mr-2 fill-current" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  Start
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={skipSession}
              className="h-10 w-10 rounded-full border-muted-foreground/20"
            >
              <SkipForward className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Sound Test Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={playSynthesizedAlarm}
        className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
      >
        <BellRing className="h-3 w-3" />
        Test Chime Sound
      </Button>
    </div>
  );
}
