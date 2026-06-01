"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePlannerStore, Task } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, Check, Clock, X } from "lucide-react";
import { format } from "date-fns";

export default function AlarmManager() {
  const tasks = usePlannerStore((state) => state.tasks);
  const updateTask = usePlannerStore((state) => state.updateTask);
  const toggleTask = usePlannerStore((state) => state.toggleTask);
  const { t } = useLanguageStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());

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
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + startDelay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      // Play a beautiful "ding ding ding" chime melody
      playTone(523.25, 0, 0.3); // C5
      playTone(659.25, 0.15, 0.3); // E5
      playTone(783.99, 0.3, 0.5); // G5
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by browser autoplay policy.");
    }
  };

  // Loop to check time every 10 seconds
  useEffect(() => {
    const checkAlarms = () => {
      if (activeTask) return; // Don't trigger another while one is active

      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const currentHHMM = format(now, "HH:mm");

      // Filter tasks due today, incomplete, and with alarm set
      const todaysTasks = tasks.filter(
        (t) => t.dueDate === todayStr && !t.completed && t.alarmTime
      );

      for (const task of todaysTasks) {
        if (!task.alarmTime) continue;
        
        // Normalize time comparison
        const [tHours, tMins] = task.alarmTime.split(":").map(Number);
        const taskHHMM = `${String(tHours).padStart(2, "0")}:${String(tMins).padStart(2, "0")}`;

        if (taskHHMM === currentHHMM) {
          const triggerKey = `${task.id}-${todayStr}-${taskHHMM}`;
          if (!triggeredRef.current.has(triggerKey)) {
            triggeredRef.current.add(triggerKey);
            setActiveTask(task);
            break; // only trigger one at a time
          }
        }
      }
    };

    // Check immediately and then every 10 seconds
    checkAlarms();
    const interval = setInterval(checkAlarms, 10000);
    return () => clearInterval(interval);
  }, [tasks, activeTask]);

  // Audio repetition loop when alarm is active
  useEffect(() => {
    if (!activeTask) return;

    // Play immediately
    playSynthesizedAlarm();

    // Repeat every 2.5 seconds
    const interval = setInterval(playSynthesizedAlarm, 2500);
    return () => clearInterval(interval);
  }, [activeTask]);

  if (!activeTask) return null;

  const handleSnooze = () => {
    if (!activeTask || !activeTask.alarmTime) return;
    const [hours, minutes] = activeTask.alarmTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + 5);
    const newAlarmTime = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    
    updateTask(activeTask.id, { alarmTime: newAlarmTime });
    setActiveTask(null);
  };

  const handleComplete = () => {
    if (!activeTask) return;
    toggleTask(activeTask.id);
    setActiveTask(null);
  };

  const handleDismiss = () => {
    setActiveTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="max-w-md w-full bg-card/90 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-5">
          {/* Animated Alarm Icon */}
          <div className="relative h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner border border-primary/15">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75 pointer-events-none" />
            <BellRing className="h-8 w-8 animate-bounce duration-500" />
          </div>

          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20">
              {t("alarm.title")}
            </span>
            <h3 className="text-lg font-extrabold tracking-tight text-foreground line-clamp-2 pt-2">
              {activeTask.title}
            </h3>
            {activeTask.alarmTime && (
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground font-sans">
                <Clock className="h-3.5 w-3.5" />
                <span>{activeTask.alarmTime}</span>
              </div>
            )}
          </div>

          {activeTask.notes && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 bg-muted/30 p-3 rounded-xl border w-full text-start">
              {activeTask.notes}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 w-full pt-2">
            <Button
              onClick={handleComplete}
              className="flex-1 font-semibold text-xs py-5 rounded-2xl shadow-md order-1 sm:order-2"
            >
              <Check className="h-4 w-4 mr-1.5" />
              {t("alarm.markCompleted")}
            </Button>
            <Button
              variant="outline"
              onClick={handleSnooze}
              className="flex-1 font-semibold text-xs py-5 rounded-2xl order-2 sm:order-1 border-muted-foreground/20"
            >
              <Clock className="h-4 w-4 mr-1.5" />
              {t("alarm.snooze")}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground h-9 w-9 rounded-full p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
