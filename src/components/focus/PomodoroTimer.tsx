"use client";

import { useState, useEffect, useRef } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, RotateCcw, SkipForward, Flame, BellRing, Music, Volume2, VolumeX } from "lucide-react";
import { format } from "date-fns";

export default function PomodoroTimer() {
  const tasks = usePlannerStore((state) => state.tasks);
  const completePomodoro = usePlannerStore((state) => state.completePomodoro);
  const { t } = useLanguageStore();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr && !t.completed);

  // Focus Modes: 'focus' or 'break'
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  
  // Lofi Music Player states
  const [selectedTrack, setSelectedTrack] = useState<string>("none");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Custom durations in minutes
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const FOCUS_TIME = focusMinutes * 60;
  const BREAK_TIME = breakMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle duration input updates safely when timer is not active
  const handleFocusMinutesChange = (val: number) => {
    if (val < 1) return;
    setFocusMinutes(val);
    if (mode === "focus" && !isActive) {
      setSecondsLeft(val * 60);
    }
  };

  const handleBreakMinutesChange = (val: number) => {
    if (val < 1) return;
    setBreakMinutes(val);
    if (mode === "break" && !isActive) {
      setSecondsLeft(val * 60);
    }
  };

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
  }, [isActive, mode, focusMinutes, breakMinutes]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playSynthesizedAlarm();

    if (mode === "focus") {
      completePomodoro(); // Award XP & record statistics
      setMode("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode("focus");
      setSecondsLeft(focusMinutes * 60);
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

  const tracksList = [
    { id: "none", title: "Off (Muted)" },
    { id: "sleepy-cat", title: "Sleepy Cat", url: "https://assets.mixkit.co/music/135/135.mp3" },
    { id: "sweet-september", title: "Sweet September", url: "https://assets.mixkit.co/music/282/282.mp3" },
    { id: "lofi-02", title: "Cozy City", url: "https://assets.mixkit.co/music/764/764.mp3" },
    { id: "lofi-03", title: "Jazz Lounge", url: "https://assets.mixkit.co/music/765/765.mp3" },
  ];

  // Control volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Handle soundtrack play/pause and source swaps
  useEffect(() => {
    if (selectedTrack === "none") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingMusic(false);
      return;
    }

    const currentTrackObj = tracksList.find((t) => t.id === selectedTrack);
    if (!currentTrackObj || !currentTrackObj.url) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(currentTrackObj.url);
      audioRef.current.loop = true;
      audioRef.current.volume = musicVolume;
    } else if (audioRef.current.src !== currentTrackObj.url) {
      audioRef.current.pause();
      audioRef.current.src = currentTrackObj.url;
      audioRef.current.load();
    }

    if (isPlayingMusic) {
      audioRef.current.play().catch((err) => {
        console.warn("Audio autoplay blocked by browser or failed to load:", err);
        setIsPlayingMusic(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [selectedTrack, isPlayingMusic]);

  // Make sure we stop audio if component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

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
        <h2 className="text-2xl font-bold tracking-tight">{t('focus.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('focus.subtitle')}
        </p>
      </div>

      {/* Task & Timer Settings Selector */}
      <Card className="w-full bg-card/60 backdrop-blur-md border">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              {t('focus.bindTask')}
            </label>
            <Select value={selectedTaskId} onValueChange={(val) => setSelectedTaskId(val || "")}>
              <SelectTrigger className="w-full font-medium">
                <SelectValue placeholder={t('focus.selectTask')} />
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
                    {t('focus.noTasks')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedTask && (
              <div className="text-xs font-semibold text-primary/80 flex items-center gap-1.5 pl-1 pt-1">
                <Flame className="h-3.5 w-3.5" />
                {t('focus.focusingOn')} <span className="underline">{selectedTask.title}</span> {t('focus.xpBonus')}
              </div>
            )}
          </div>

          {/* Duration Configuration */}
          <div className="grid grid-cols-2 gap-4 pt-3.5 border-t">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                {t('focus.focusDuration')}
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={focusMinutes}
                  onChange={(e) => handleFocusMinutesChange(Number(e.target.value))}
                  disabled={isActive}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('focus.minutesUnit')}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                {t('focus.breakDuration')}
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) => handleBreakMinutesChange(Number(e.target.value))}
                  disabled={isActive}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('focus.minutesUnit')}</span>
              </div>
            </div>
          </div>
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
            {mode === "focus" ? t('focus.session') : t('focus.shortBreak')}
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
                {mode === "focus" ? t('focus.workTime') : t('focus.breakTime')}
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
                  {t('focus.pause')}
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  {t('focus.start')}
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
      
      {/* Lofi Soundtrack Card */}
      <Card className="w-full bg-card/60 backdrop-blur-md border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-primary" />
              {t('focus.soundtrack')}
            </label>
            {selectedTrack !== "none" && (
              <span className="text-[10px] font-bold text-primary animate-pulse bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full font-mono">
                {isPlayingMusic ? "PLAYING" : "PAUSED"}
              </span>
            )}
          </div>

          {/* Custom Animated Lofi Girl SVG Interactive Button */}
          <div 
            onClick={() => {
              if (selectedTrack !== "none") {
                setIsPlayingMusic(!isPlayingMusic);
              }
            }}
            className={`w-full h-36 bg-zinc-950 rounded-2xl relative overflow-hidden border border-primary/15 transition-all duration-300 ${
              selectedTrack === "none" ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary/45 hover:shadow-md"
            }`}
          >
            {/* Ambient Room SVG drawing */}
            <svg className="w-full h-full" viewBox="0 0 300 144" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Warm radial gradient for the lamp cone */}
                <radialGradient id="lampGlow" cx="65%" cy="20%" r="60%" fx="65%" fy="20%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#fef08a" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                </radialGradient>
                {/* Star backdrop patterns */}
                <pattern id="starsPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="8" r="0.6" fill="#fff" opacity="0.6" />
                  <circle cx="25" cy="18" r="0.4" fill="#fff" opacity="0.4" />
                  <circle cx="15" cy="30" r="0.5" fill="#fff" opacity="0.7" />
                </pattern>
              </defs>

              {/* Starry window background */}
              <rect x="25" y="15" width="65" height="60" rx="6" fill="#09090b" />
              <rect x="25" y="15" width="65" height="60" rx="6" fill="url(#starsPattern)" />
              <line x1="57.5" y1="15" x2="57.5" y2="75" stroke="#18181b" strokeWidth="1.5" />
              <line x1="25" y1="45" x2="90" y2="45" stroke="#18181b" strokeWidth="1.5" />

              {/* Desk Lamp Cone (Glows when music is playing) */}
              {selectedTrack !== "none" && (
                <polygon 
                  points="225,25 120,120 280,120" 
                  fill="url(#lampGlow)" 
                  className={isPlayingMusic ? "animate-pulse" : ""} 
                  style={{ animationDuration: '3s' }}
                />
              )}

              {/* The Desk */}
              <rect x="0" y="115" width="300" height="29" fill="#18181b" />
              <line x1="0" y1="115" x2="300" y2="115" stroke="#27272a" strokeWidth="1" />

              {/* Steaming Coffee Cup */}
              <rect x="145" y="105" width="8" height="10" rx="1.5" fill="#52525b" />
              <path d="M153,107 C155,107 155,111 153,111" stroke="#52525b" strokeWidth="1.5" fill="none" />
              {/* Steam waves */}
              {isPlayingMusic && (
                <g className="animate-lofi-steam">
                  <path d="M147,100 Q146,96 148,93 T146,86" stroke="#a1a1aa" strokeWidth="0.8" fill="none" opacity="0.8" />
                  <path d="M151,102 Q150,98 152,95 T150,88" stroke="#a1a1aa" strokeWidth="0.8" fill="none" opacity="0.6" />
                </g>
              )}

              {/* The Desk Lamp */}
              <path d="M255,115 L255,45 C255,35 240,25 225,25" stroke="#3f3f46" strokeWidth="3" fill="none" />
              <path d="M217,21 L233,29 L225,37 Z" fill="#71717a" />
              <circle cx="255" cy="115" r="4" fill="#3f3f46" />

              {/* Laptop Screen (Glows with screen shine) */}
              <rect x="92" y="114" width="22" height="2" fill="#52525b" />
              <polygon points="94,114 112,114 116,92 98,92" fill="#27272a" />
              <polygon points="95,113 111,113 114,93 99,93" fill="#38bdf8" opacity="0.25" className={isPlayingMusic ? "animate-pulse" : ""} />

              {/* Lofi Girl Group */}
              <g>
                {/* Chair silhouette */}
                <line x1="55" y1="102" x2="55" y2="128" stroke="#3f3f46" strokeWidth="2.5" />
                <line x1="68" y1="102" x2="68" y2="128" stroke="#3f3f46" strokeWidth="2.5" />
                <path d="M48,102 L75,102" stroke="#27272a" strokeWidth="4" />
                <path d="M48,75 L48,102" stroke="#27272a" strokeWidth="4" />

                {/* Girl Silhouette */}
                {/* Body/Back */}
                <path d="M54,115 C54,100 58,90 68,85 C78,80 82,90 85,102 L85,115 Z" fill="#27272a" />
                {/* Leaning Arm */}
                <path d="M80,102 C85,102 95,110 100,114 L75,114 Z" fill="#18181b" />

                {/* Head Group (Bobs when playing music) */}
                <g className={isPlayingMusic ? "animate-lofi-head" : ""}>
                  {/* Neck */}
                  <rect x="66" y="80" width="6" height="8" fill="#27272a" />
                  {/* Head */}
                  <circle cx="70" cy="72" r="9" fill="#27272a" />
                  {/* Hair bun / pony */}
                  <circle cx="61" cy="70" r="4.5" fill="#27272a" />
                  {/* Headphones */}
                  <path d="M66,64 C70,61 74,61 78,64" stroke="#71717a" strokeWidth="2" fill="none" />
                  <rect x="62" y="68" width="3" height="7" rx="1.5" fill="#a1a1aa" />
                  <rect x="75" y="68" width="3" height="7" rx="1.5" fill="#a1a1aa" />
                </g>
              </g>
            </svg>

            {/* Floating Music Notes (only when playing) */}
            {isPlayingMusic && (
              <>
                <Music className="absolute text-primary/75 h-4 w-4 animate-lofi-note-1 pointer-events-none" style={{ top: '35%', left: '22%' }} />
                <Music className="absolute text-primary/55 h-3.5 w-3.5 animate-lofi-note-2 pointer-events-none" style={{ top: '40%', left: '26%' }} />
              </>
            )}

            {/* Overlay Help Prompt if no track is selected */}
            {selectedTrack === "none" && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-3 text-center space-y-1.5 backdrop-blur-[1px] transition-all">
                <Music className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground leading-snug">
                  {t('focus.track.selectPrompt')}
                </span>
              </div>
            )}

            {/* Direct Play/Pause Button overlay on hover when a track is active */}
            {selectedTrack !== "none" && (
              <div className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-full bg-primary/95 text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all opacity-90 sm:opacity-0 sm:hover:opacity-100 sm:group-hover:opacity-100 pointer-events-none">
                {isPlayingMusic ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Track Selector */}
            <Select value={selectedTrack} onValueChange={(val) => {
              setSelectedTrack(val || "none");
              if (val && val !== "none") {
                setIsPlayingMusic(true);
              }
            }}>
              <SelectTrigger className="w-full text-xs font-semibold h-10 bg-card/40 border">
                <SelectValue placeholder="Select Soundtrack" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs font-semibold">{t('focus.track.none')}</SelectItem>
                <SelectItem value="sleepy-cat" className="text-xs font-semibold">🐱 Sleepy Cat (Ambient Lo-Fi)</SelectItem>
                <SelectItem value="sweet-september" className="text-xs font-semibold">🍂 Sweet September (Melodic Lo-Fi)</SelectItem>
                <SelectItem value="lofi-02" className="text-xs font-semibold">🌆 Cozy City (Chill Hop)</SelectItem>
                <SelectItem value="lofi-03" className="text-xs font-semibold">🎷 Jazz Lounge (Jazz Lo-Fi)</SelectItem>
              </SelectContent>
            </Select>

            {/* Volume Control Slider */}
            {selectedTrack !== "none" && (
              <div className="flex items-center space-x-3 pt-1 animate-in fade-in slide-in-from-top-1.5 duration-200">
                <button 
                  onClick={() => setMusicVolume(musicVolume === 0 ? 0.5 : 0)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {musicVolume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-[10px] font-bold font-mono text-muted-foreground w-8 text-right shrink-0">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
            )}
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
        {t('focus.testSound')}
      </Button>
    </div>
  );
}
