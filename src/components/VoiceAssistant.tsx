"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePlannerStore, Task } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Settings, Send, RefreshCw, Check, AlertCircle, X, Brain } from "lucide-react";

// Local Rule-Based NLP Parser for Indonesian & English
function localNlpParse(text: string, defaultDate: string): Omit<Task, "id" | "carryOverCount" | "createdAt" | "completed">[] {
  const tasks: Omit<Task, "id" | "carryOverCount" | "createdAt" | "completed">[] = [];
  
  // Clean text and split by common list indicators or conjunctions
  // "lalu", "kemudian", "terus", "sama", "and then", "then", "after that"
  const cleanText = text.toLowerCase().trim();
  const chunks = cleanText.split(/\s*(?:lalu|kemudian|terus|setelah\s+itu|and\s+then|then|after\s+that|;\s*)\s*/i);

  chunks.forEach((chunk) => {
    if (!chunk.trim() || chunk.length < 3) return;

    let priority: "High" | "Medium" | "Low" = "Medium";
    let alarmTime: string | undefined = undefined;

    // Detect priority keywords
    if (chunk.match(/(penting|mendesak|darurat|prioritas|high|urgent|important)/i)) {
      priority = "High";
    } else if (chunk.match(/(santai|nanti|bisa\s+nanti|low|casual|relax)/i)) {
      priority = "Low";
    }

    // Detect times
    // Format: "jam 10", "jam 14:00", "jam 2 siang", "at 10 am", "at 3:30 pm"
    const timeMatchIndo = chunk.match(/(?:jam|pukul)\s*(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/i);
    const timeMatchEng = chunk.match(/(?:at|by)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

    if (timeMatchIndo) {
      let hours = parseInt(timeMatchIndo[1], 10);
      const minutes = timeMatchIndo[2] ? parseInt(timeMatchIndo[2], 10) : 0;
      const period = timeMatchIndo[3];

      if (period) {
        if (period === "siang" && hours < 12) hours += 0; // e.g. jam 12 siang is 12
        else if ((period === "sore" || period === "malam") && hours < 12) hours += 12; // e.g. jam 7 malam is 19
      } else if (hours < 7) {
        // assumption: if no period and < 7, it's likely afternoon (e.g. "jam 2" is 14)
        hours += 12;
      }
      
      alarmTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    } else if (timeMatchEng) {
      let hours = parseInt(timeMatchEng[1], 10);
      const minutes = timeMatchEng[2] ? parseInt(timeMatchEng[2], 10) : 0;
      const ampm = timeMatchEng[3];

      if (ampm) {
        if (ampm.toLowerCase() === "pm" && hours < 12) hours += 12;
        if (ampm.toLowerCase() === "am" && hours === 12) hours = 0;
      }
      
      alarmTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    // Extract title by stripping timing phrases
    let title = chunk
      .replace(/(?:hari\s+ini|today)/gi, "")
      .replace(/(?:saya\s+mau|aku\s+mau|saya\s+akan|aku\s+akan|i\s+want\s+to|i\s+will|i\s+have\s+a)/gi, "")
      .replace(/(?:jam|pukul)\s*\d{1,2}(?::\d{2})?\s*(?:pagi|siang|sore|malam)?/gi, "")
      .replace(/(?:at|by)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, "")
      .replace(/(?:penting|mendesak|darurat|prioritas|high|urgent|important|low|casual|relax)/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    // Capitalize first letter
    if (title) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      tasks.push({
        title,
        priority,
        dueDate: defaultDate,
        tags: ["Voice AI"],
        subtasks: [],
        notes: `Ditambahkan via Voice AI. Transkrip: "${chunk.trim()}"`,
        alarmTime,
      });
    }
  });

  return tasks;
}

export function VoiceAssistant() {
  const { t, language } = useLanguageStore();
  const tasks = usePlannerStore((state) => state.tasks);
  const addTask = usePlannerStore((state) => state.addTask);
  const voiceAiEnabled = usePlannerStore((state) => state.voiceAiEnabled);
  const voiceAiProvider = usePlannerStore((state) => state.voiceAiProvider);
  const ollamaEndpoint = usePlannerStore((state) => state.ollamaEndpoint);
  const ollamaModel = usePlannerStore((state) => state.ollamaModel);
  const updateVoiceSettings = usePlannerStore((state) => state.updateVoiceSettings);

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedTasks, setParsedTasks] = useState<Omit<Task, "id" | "carryOverCount" | "createdAt" | "completed">[]>([]);
  const [aiState, setAiState] = useState<"idle" | "greeting" | "listening" | "processing" | "confirming">("idle");
  const [aiSpeechMuted, setAiSpeechMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = language === "id" ? "id-ID" : "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setAiState("listening");
          setErrorMsg("");
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsListening(false);
          setAiState("idle");
          if (event.error === "not-allowed") {
            setErrorMsg(language === "id" ? "Izin mikrofon ditolak." : "Microphone permission denied.");
          } else {
            setErrorMsg(language === "id" ? "Gagal mendengarkan suara." : "Speech recognition failed.");
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = async (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          await processTranscript(text);
        };

        recognitionRef.current = rec;
      }
    }
  }, [language]);

  // Handle TTS Greeting
  const speak = (text: string) => {
    if (aiSpeechMuted || typeof window === "undefined") return;
    window.speechSynthesis.cancel(); // cancel any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "id" ? "id-ID" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setAiState("greeting");
    const greetingText = language === "id" 
      ? "Halo! Apa rencana kegiatanmu untuk hari ini?" 
      : "Hello! What are your plans for today?";
    speak(greetingText);
  };

  const handleStartListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    } else {
      setErrorMsg(language === "id" ? "Web Speech API tidak didukung browser ini." : "Speech recognition is not supported in this browser.");
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processTranscript = async (text: string) => {
    setAiState("processing");
    const todayStr = new Date().toISOString().split("T")[0];

    if (voiceAiProvider === "ollama") {
      try {
        const response = await fetch(`${ollamaEndpoint}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: `Kamu adalah asisten pengelola tugas. Ekstrak aktivitas harian dari teks berikut ke dalam format JSON yang valid.
Format JSON harus berupa array dari objek dengan format:
[
  {
    "title": "judul tugas/kegiatan singkat",
    "priority": "High" | "Medium" | "Low",
    "alarmTime": "HH:MM" (format jam 24 jam jika disebutkan waktu kegiatannya, jika tidak ada kosongkan saja atau null),
    "notes": "catatan singkat jika ada info tambahan"
  }
]
Jangan memberikan kalimat pembuka atau penutup. Berikan HANYA array JSON mentah saja.
Teks input: "${text}"`,
            stream: false,
            options: {
              temperature: 0.1
            }
          }),
        });

        if (!response.ok) throw new Error("Ollama connection failed");
        
        const data = await response.json();
        let cleanedResponse = data.response.trim();
        // Strip markdown formatting if AI outputs code block
        if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        const tasksParsed = JSON.parse(cleanedResponse);
        if (Array.isArray(tasksParsed)) {
          const formatted = tasksParsed.map((t: any) => ({
            title: t.title || "Kegiatan Baru",
            priority: t.priority === "High" || t.priority === "Low" ? t.priority : "Medium",
            dueDate: todayStr,
            tags: ["Voice AI (Ollama)"],
            subtasks: [],
            notes: t.notes || `Ekstraksi AI dari transkrip: "${text}"`,
            alarmTime: t.alarmTime || undefined,
          }));
          setParsedTasks(formatted);
          setAiState("confirming");
          speak(language === "id" ? `Saya berhasil memetakan ${formatted.length} kegiatan. Silakan periksa daftar tugas di bawah ini.` : `I extracted ${formatted.length} tasks. Please verify the checklist below.`);
          return;
        }
      } catch (err) {
        console.warn("Ollama parsing failed, falling back to local rule-based engine:", err);
      }
    }

    // Local rule-based fallback
    const result = localNlpParse(text, todayStr);
    setParsedTasks(result);
    setAiState("confirming");
    
    if (result.length > 0) {
      speak(language === "id" ? `Berhasil mengambil ${result.length} kegiatan. Silakan periksa kembali.` : `Extracted ${result.length} tasks. Please confirm below.`);
    } else {
      speak(language === "id" ? "Saya kurang memahami kegiatannya. Bisa ulangi kembali?" : "I couldn't detect any task. Could you try again?");
      setAiState("idle");
    }
  };

  const handleSaveTasks = () => {
    parsedTasks.forEach((t) => addTask(t));
    setParsedTasks([]);
    setTranscript("");
    setAiState("idle");
    setIsOpen(false);
    speak(language === "id" ? "Tugas berhasil ditambahkan ke rencana harian Anda!" : "Tasks successfully added to your planner!");
  };

  return (
    <>
      {/* Floating Trigger Button (Cozy Pixel Art Design) */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-2xl bg-[#ab7052] border-4 border-[#4d3227] hover:scale-105 active:scale-95 transition-all shadow-[4px_4px_0px_#4d3227] flex items-center justify-center text-white cursor-pointer select-none"
        title={language === "id" ? "Tanya Asisten AI Suara" : "Ask Voice AI"}
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
      </button>

      {/* Interactive Modal Widget */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-mono">
          <Card className="max-w-md w-full bg-[#f4ecd8] border-4 border-[#4d3227] shadow-[8px_8px_0px_#4d3227] rounded-none text-[#4d3227]">
            <CardContent className="p-6 relative">
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b-2 border-dashed border-[#4d3227] mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  <span className="font-bold text-xs uppercase tracking-wider">AI Lofi Assistant</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setAiSpeechMuted(!aiSpeechMuted)}
                    className="p-1 hover:bg-[#ab7052]/10 rounded"
                  >
                    {aiSpeechMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 hover:bg-[#ab7052]/10 rounded"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => { setIsOpen(false); handleStopListening(); }}
                    className="p-1 hover:bg-[#ab7052]/10 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Settings Sub-Panel */}
              {showSettings ? (
                <div className="bg-[#e5cda3] p-4 border-2 border-[#4d3227] mb-4 space-y-3 text-xs">
                  <h4 className="font-bold border-b border-[#4d3227] pb-1 uppercase">Settings</h4>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold">Provider:</label>
                    <select
                      value={voiceAiProvider}
                      onChange={(e) => updateVoiceSettings({ voiceAiProvider: e.target.value as any })}
                      className="p-1.5 bg-[#f4ecd8] border-2 border-[#4d3227] outline-none"
                    >
                      <option value="local">{language === "id" ? "Offline Bawaan (Ringan & Cepat)" : "Offline Local (Fast)"}</option>
                      <option value="ollama">Ollama LLM (Lokal di PC Anda)</option>
                    </select>
                  </div>

                  {voiceAiProvider === "ollama" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold">Ollama Address:</label>
                        <input
                          type="text"
                          value={ollamaEndpoint}
                          onChange={(e) => updateVoiceSettings({ ollamaEndpoint: e.target.value })}
                          className="p-1.5 bg-[#f4ecd8] border-2 border-[#4d3227] outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold">Ollama Model:</label>
                        <input
                          type="text"
                          value={ollamaModel}
                          onChange={(e) => updateVoiceSettings({ ollamaModel: e.target.value })}
                          className="p-1.5 bg-[#f4ecd8] border-2 border-[#4d3227] outline-none"
                          placeholder="e.g. qwen2.5:0.5b"
                        />
                      </div>
                    </>
                  )}
                  <Button
                    onClick={() => setShowSettings(false)}
                    className="w-full mt-2 bg-[#ab7052] border-2 border-[#4d3227] text-white rounded-none hover:bg-[#8d5236] text-xs py-1"
                  >
                    Save & Close
                  </Button>
                </div>
              ) : null}

              {/* Cozy AI Avatar Display */}
              <div className="flex items-center gap-4 bg-[#e5cda3] p-4 border-2 border-[#4d3227] mb-4">
                {/* SVG Pixel AI Avatar */}
                <div className="h-16 w-16 bg-[#bc8265] border-2 border-[#4d3227] flex items-center justify-center relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[#bc8265]" />
                  <svg width="40" height="40" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="z-10 animate-bounce duration-1000">
                    <rect x="3" y="4" width="10" height="8" fill="#f4ecd8" />
                    <rect x="2" y="6" width="12" height="4" fill="#f4ecd8" />
                    {/* Eyes */}
                    {aiState === "listening" ? (
                      <>
                        <rect x="5" y="7" width="2" height="1" fill="#4d3227" />
                        <rect x="9" y="7" width="2" height="1" fill="#4d3227" />
                      </>
                    ) : aiState === "processing" ? (
                      <>
                        <rect x="5" y="7" width="2" height="2" fill="#df8c8f" />
                        <rect x="9" y="7" width="2" height="2" fill="#df8c8f" />
                      </>
                    ) : (
                      <>
                        <rect x="5" y="7" width="2" height="2" fill="#4d3227" />
                        <rect x="9" y="7" width="2" height="2" fill="#4d3227" />
                      </>
                    )}
                    {/* Cheeks */}
                    <rect x="4" y="9" width="1" height="1" fill="#df8c8f" />
                    <rect x="11" y="9" width="1" height="1" fill="#df8c8f" />
                    {/* Mouth */}
                    {aiState === "listening" ? (
                      <rect x="7" y="9" width="2" height="1" fill="#4d3227" />
                    ) : (
                      <rect x="7" y="10" width="2" height="1" fill="#4d3227" />
                    )}
                  </svg>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-[#ab7052] uppercase font-mono">
                    {aiState === "listening" ? "Listening..." : aiState === "processing" ? "Processing..." : "Lofi Bot Assistant"}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">
                    {aiState === "greeting" && (language === "id" ? "Ada rencana apa hari ini?" : "Any plans for today?")}
                    {aiState === "listening" && (language === "id" ? "Silakan berbicara..." : "Speak now...")}
                    {aiState === "processing" && (language === "id" ? "Sedang menerjemahkan suara..." : "Processing audio...")}
                    {aiState === "confirming" && (language === "id" ? "Silakan tinjau daftar agenda Anda!" : "Please confirm your agenda list!")}
                    {aiState === "idle" && (language === "id" ? "Klik mikrofon untuk mulai berbicara" : "Click mic to speak")}
                  </p>
                </div>
              </div>

              {/* Status & Speech Input Box */}
              {transcript && (
                <div className="bg-[#f4ecd8] border-2 border-[#4d3227] p-3 mb-4 text-xs font-sans italic text-muted-foreground">
                  "{transcript}"
                </div>
              )}

              {/* Confirming Extracted Tasks */}
              {aiState === "confirming" && parsedTasks.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4 border-t-2 border-dashed border-[#4d3227] pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block">Extracted tasks:</span>
                  {parsedTasks.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#e5cda3] border border-[#4d3227] text-xs">
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <span className="font-bold line-clamp-1">{t.title}</span>
                        {t.alarmTime && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-sans">
                            ⏰ {t.alarmTime}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 border ${
                        t.priority === "High" ? "bg-red-200 border-red-500 text-red-700" :
                        t.priority === "Low" ? "bg-blue-200 border-blue-500 text-blue-700" :
                        "bg-yellow-200 border-yellow-500 text-yellow-700"
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Microphone trigger & buttons */}
              <div className="flex gap-3 justify-center">
                {aiState === "confirming" ? (
                  <>
                    <Button
                      onClick={handleSaveTasks}
                      className="bg-emerald-600 border-2 border-[#4d3227] hover:bg-emerald-700 text-white rounded-none shadow-[2px_2px_0px_#4d3227] font-bold text-xs"
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      {language === "id" ? "Simpan ke List" : "Confirm Tasks"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setAiState("idle"); setParsedTasks([]); setTranscript(""); }}
                      className="border-2 border-[#4d3227] bg-rose-200 hover:bg-rose-300 text-[#4d3227] rounded-none shadow-[2px_2px_0px_#4d3227] font-bold text-xs"
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                      {language === "id" ? "Ulangi" : "Reset"}
                    </Button>
                  </>
                ) : (
                  <button
                    onClick={isListening ? handleStopListening : handleStartListening}
                    className={`h-16 w-16 rounded-full border-4 border-[#4d3227] shadow-[2px_2px_0px_#4d3227] flex items-center justify-center transition-all ${
                      isListening ? "bg-rose-500 text-white animate-pulse" : "bg-[#bc8265] text-white hover:scale-105"
                    }`}
                  >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                )}
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 mt-4 font-sans bg-rose-50 p-2.5 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
