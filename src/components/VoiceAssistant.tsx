"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePlannerStore, Task } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Settings, Send, RefreshCw, Check, AlertCircle, X, Brain } from "lucide-react";

// Local Rule-Based NLP Parser for Indonesian & English
function localNlpParse(text: string, defaultDate: string, language: string): Omit<Task, "id" | "carryOverCount" | "createdAt" | "completed">[] {
  const tasks: Omit<Task, "id" | "carryOverCount" | "createdAt" | "completed">[] = [];
  const cleanText = text.toLowerCase().trim();
  
  // Split chunks based on language
  let chunks: string[] = [];
  if (language === "id") {
    chunks = cleanText.split(/\s*(?:lalu|kemudian|terus|setelah\s+itu|dan\s+juga|;\s*)\s*/i);
  } else {
    chunks = cleanText.split(/\s*(?:and\s+then|then|after\s+that|and\s+also|;\s*)\s*/i);
  }

  chunks.forEach((chunk) => {
    if (!chunk.trim() || chunk.length < 3) return;

    let priority: "High" | "Medium" | "Low" = "Medium";
    let alarmTime: string | undefined = undefined;

    // Detect priority keywords based on language
    if (language === "id") {
      if (chunk.match(/(penting|mendesak|darurat|prioritas|utama)/i)) {
        priority = "High";
      } else if (chunk.match(/(santai|nanti|bisa\s+nanti|rendah)/i)) {
        priority = "Low";
      }
    } else {
      if (chunk.match(/(urgent|important|high|priority|critical)/i)) {
        priority = "High";
      } else if (chunk.match(/(low|casual|relax|later)/i)) {
        priority = "Low";
      }
    }

    // Detect times
    if (language === "id") {
      const timeMatchIndo = chunk.match(/(?:jam|pukul)\s*(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/i);
      if (timeMatchIndo) {
        let hours = parseInt(timeMatchIndo[1], 10);
        const minutes = timeMatchIndo[2] ? parseInt(timeMatchIndo[2], 10) : 0;
        const period = timeMatchIndo[3];

        if (period) {
          if (period === "siang" && hours < 12) hours += 0;
          else if ((period === "sore" || period === "malam") && hours < 12) hours += 12;
        } else if (hours < 7) {
          hours += 12; // assumed pm
        }
        alarmTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }
    } else {
      const timeMatchEng = chunk.match(/(?:at|by)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (timeMatchEng) {
        let hours = parseInt(timeMatchEng[1], 10);
        const minutes = timeMatchEng[2] ? parseInt(timeMatchEng[2], 10) : 0;
        const ampm = timeMatchEng[3];

        if (ampm) {
          if (ampm.toLowerCase() === "pm" && hours < 12) hours += 12;
          if (ampm.toLowerCase() === "am" && hours === 12) hours = 0;
        }
        alarmTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }
    }

    // Extract title by stripping timing and stop-words
    let title = chunk;
    if (language === "id") {
      title = title
        .replace(/(?:hari\s+ini|esok|besok)/gi, "")
        .replace(/(?:saya\s+mau|aku\s+mau|saya\s+akan|aku\s+akan|ingin)/gi, "")
        .replace(/(?:jam|pukul)\s*\d{1,2}(?::\d{2})?\s*(?:pagi|siang|sore|malam)?/gi, "")
        .replace(/(?:penting|mendesak|darurat|prioritas|utama|santai|nanti|bisa\s+nanti|rendah)/gi, "");
    } else {
      title = title
        .replace(/(?:today|tomorrow)/gi, "")
        .replace(/(?:i\s+want\s+to|i\s+will|i\s+have\s+to|should|need\s+to)/gi, "")
        .replace(/(?:at|by)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, "")
        .replace(/(?:urgent|important|high|priority|critical|low|casual|relax|later)/gi, "");
    }

    title = title.replace(/\s+/g, " ").trim();

    // Capitalize first letter
    if (title) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      const noteText = language === "id" 
        ? `Ditambahkan via Suara. Transkrip: "${chunk.trim()}"`
        : `Added via Voice. Transcript: "${chunk.trim()}"`;

      tasks.push({
        title,
        priority,
        dueDate: defaultDate,
        tags: [language === "id" ? "Suara" : "Voice"],
        subtasks: [],
        notes: noteText,
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
  const webLlmModel = usePlannerStore((state) => state.webLlmModel);
  const updateVoiceSettings = usePlannerStore((state) => state.updateVoiceSettings);

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedTasks, setParsedTasks] = useState<Omit<Task, "id" | "carryOverCount" | "createdAt" | "completed">[]>([]);
  const [aiState, setAiState] = useState<"idle" | "greeting" | "listening" | "processing" | "confirming">("idle");
  const [aiSpeechMuted, setAiSpeechMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [speakingLanguage, setSpeakingLanguage] = useState<string>(language);
  const [webLlmProgress, setWebLlmProgress] = useState("");
  const [webLlmProgressPercent, setWebLlmProgressPercent] = useState(0);
  const [webLlmLoading, setWebLlmLoading] = useState(false);

  const engineRef = useRef<any>(null);

  // Sync speaking language when app language changes
  useEffect(() => {
    setSpeakingLanguage(language);
  }, [language]);

  // Clean up WebLLM engine on unmount if any
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (engineRef.current) {
        try {
          engineRef.current.unload();
        } catch (e) {
          console.warn("Unloading failed:", e);
        }
      }
    };
  }, []);

  const initWebLlmEngine = async () => {
    if (engineRef.current) return engineRef.current;
    
    setWebLlmLoading(true);
    setWebLlmProgress(language === "id" ? "Menyiapkan WebGPU..." : "Initializing WebGPU...");
    setWebLlmProgressPercent(0);
    
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      
      // Check WebGPU compatibility
      if (typeof navigator === "undefined" || !(navigator as any).gpu) {
        throw new Error("WebGPU is not supported by your browser or hardware.");
      }

      const engine = await CreateMLCEngine(webLlmModel, {
        initProgressCallback: (report) => {
          setWebLlmProgress(report.text);
          setWebLlmProgressPercent(Math.round(report.progress * 100));
        }
      });
      
      engineRef.current = engine;
      setWebLlmLoading(false);
      return engine;
    } catch (err: any) {
      setWebLlmLoading(false);
      const errMsg = err?.message || String(err);
      console.error("Failed to load WebLLM engine:", errMsg);
      throw new Error(errMsg);
    }
  };

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processTranscriptRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Language locale mapping helper
  const getLangLocale = (lang: string) => {
    switch (lang) {
      case "id": return "id-ID";
      case "en": return "en-US";
      case "ja": return "ja-JP";
      case "ar": return "ar-EG";
      case "zh": return "zh-CN";
      case "ko": return "ko-KR";
      default: return "en-US";
    }
  };

  const greetings: Record<string, string> = {
    id: "Halo! Apa rencana kegiatanmu untuk hari ini?",
    en: "Hello! What are your plans for today?",
    ja: "こんにちは！今日の予定は何ですか？",
    ar: "مرحباً! ما هي خططك لهذا اليوم؟",
    zh: "你好！你今天有什么计划？",
    ko: "안녕하세요! 오늘 계획이 어떻게 되시나요?"
  };

  const getGreeting = () => greetings[language] || greetings["en"];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = getLangLocale(speakingLanguage);

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
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
        };

        rec.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const fullText = (finalTranscript || interimTranscript).trim();
          if (fullText) {
            setTranscript(fullText);
          }

          // Reset silence timer to automatically process after 2.5 seconds of silence
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            if (fullText) {
              rec.stop();
              if (processTranscriptRef.current) {
                processTranscriptRef.current(fullText);
              }
            }
          }, 2500); // 2.5 seconds of silence
        };

        recognitionRef.current = rec;
      }
    }
  }, [language, speakingLanguage]);

  // Handle TTS Greeting
  const speak = (text: string, onEnd?: () => void) => {
    if (aiSpeechMuted || typeof window === "undefined") {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel(); // cancel any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLangLocale(language);
    if (onEnd) {
      utterance.onend = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setAiState("greeting");

    // Pre-warm/load WebLLM engine in the background while the greeting plays
    if (voiceAiProvider === "webllm") {
      initWebLlmEngine().catch((err) => {
        console.warn("Pre-warming WebLLM engine failed:", err);
      });
    }

    speak(getGreeting(), () => {
      handleStartListening();
    });
  };

  const handleStartListening = async () => {
    setErrorMsg("");
    // Request microphone permission and keep the stream active with noise suppression/echo cancellation constraints
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      } catch (err: any) {
        console.error("Microphone permission failed:", err);
        setErrorMsg(
          language === "id"
            ? "Akses mikrofon ditolak. Silakan izinkan mikrofon di pengaturan aplikasi HP Anda."
            : "Microphone access denied. Please enable microphone permissions in your App settings."
        );
        setAiState("idle");
        return;
      }
    }

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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case "id": return "Indonesian";
      case "en": return "English";
      case "ja": return "Japanese";
      case "ar": return "Arabic";
      case "zh": return "Chinese";
      case "ko": return "Korean";
      default: return "English";
    }
  };

  const processTranscript = async (text: string) => {
    setAiState("processing");
    const todayStr = new Date().toISOString().split("T")[0];

    const feedbackSpeak = (count: number) => {
      const msgs: Record<string, string> = {
        id: `Saya berhasil mengambil ${count} kegiatan. Silakan periksa di bawah ini.`,
        en: `I successfully extracted ${count} tasks. Please verify below.`,
        ja: `タスクを ${count} 件抽出しました。以下で確認してください。`,
        ar: `تم استخراج ${count} مهام. يرجى التحقق أدناه.`,
        zh: `提取了 ${count} 个任务。请在下方确认。`,
        ko: `${count}개의 할 일을 가져왔습니다. 아래에서 확인해주세요.`
      };
      speak(msgs[language] || msgs["en"]);
    };

    const errorSpeak = () => {
      const msgs: Record<string, string> = {
        id: "Saya tidak mendeteksi kegiatan apa pun. Silakan coba lagi.",
        en: "I couldn't detect any task. Please try again.",
        ja: "タスクが検出されませんでした。もう一度試してください。",
        ar: "لم أتمكن من الكشف عن أي مهمة. يرجى المحاولة مرة أخرى.",
        zh: "我没有检测到任何任务。请再试一次。",
        ko: "할 일을 감지하지 못했습니다. 다시 시도해주세요."
      };
      speak(msgs[language] || msgs["en"]);
    };

    if (voiceAiProvider === "webllm") {
      try {
        const inputLang = getLanguageName(speakingLanguage);
        const outputLang = getLanguageName(language);
        
        const engine = await initWebLlmEngine();
        
        const messages = [
          {
            role: "system",
            content: `Extract tasks from user speech into JSON array:
[{"title":"task title in ${outputLang}","priority":"High"|"Medium"|"Low","alarmTime":"HH:MM"|null,"notes":"brief note in ${outputLang}"}]
User language: ${inputLang}. Output language: ${outputLang}. No markdown, no conversation, output raw JSON only.`
          },
          {
            role: "user",
            content: text
          }
        ];

        const reply = await engine.chat.completions.create({
          messages,
          temperature: 0.0,
          max_tokens: 128,
        });
        let cleanedResponse = reply.choices[0].message.content.trim();
        if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        const tasksParsed = JSON.parse(cleanedResponse);
        if (Array.isArray(tasksParsed)) {
          const formatted = tasksParsed.map((t: any) => ({
            title: t.title || (language === "id" ? "Kegiatan Baru" : "New Task"),
            priority: t.priority === "High" || t.priority === "Low" ? t.priority : "Medium",
            dueDate: todayStr,
            tags: [language === "id" ? "Suara (Offline LLM)" : "Voice (Offline LLM)"],
            subtasks: [],
            notes: t.notes || (language === "id" ? `Ekstraksi offline: "${text}"` : `Offline extraction: "${text}"`),
            alarmTime: t.alarmTime || undefined,
          }));
          setParsedTasks(formatted);
          setAiState("confirming");
          feedbackSpeak(formatted.length);
          return;
        }
      } catch (err: any) {
        console.error("WebLLM parsing failed, falling back to local rule-based engine:", err);
        setErrorMsg(language === "id" ? `WebGPU/WebLLM gagal: ${err.message || err}` : `WebGPU/WebLLM failed: ${err.message || err}`);
      }
    }

    if (voiceAiProvider === "ollama") {
      try {
        const inputLang = getLanguageName(speakingLanguage);
        const outputLang = getLanguageName(language);
        const response = await fetch(`${ollamaEndpoint}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: `You are a helper to extract daily activities from text. Extract the activities from user speech into a valid JSON array.
The user spoke in ${inputLang}. Extract the tasks and write their titles and notes in ${outputLang}.
The JSON format must be an array of objects with the structure:
[
  {
    "title": "short task title in ${outputLang}",
    "priority": "High" | "Medium" | "Low",
    "alarmTime": "HH:MM" (24-hour time format if a time is specified in the text, otherwise null or empty string),
    "notes": "brief detail or note in ${outputLang}"
  }
]
Do not output markdown code blocks (e.g. \`\`\`json) or any conversational text. Return ONLY the raw JSON array.
Text: "${text}"`,
            stream: false,
            options: {
              temperature: 0.1
            }
          }),
        });

        if (!response.ok) throw new Error("Ollama connection failed");
        
        const data = await response.json();
        let cleanedResponse = data.response.trim();
        if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        const tasksParsed = JSON.parse(cleanedResponse);
        if (Array.isArray(tasksParsed)) {
          const formatted = tasksParsed.map((t: any) => ({
            title: t.title || "Kegiatan Baru",
            priority: t.priority === "High" || t.priority === "Low" ? t.priority : "Medium",
            dueDate: todayStr,
            tags: [language === "id" ? "Suara (Ollama)" : "Voice (Ollama)"],
            subtasks: [],
            notes: t.notes || (language === "id" ? `Ekstraksi asisten: "${text}"` : `Assistant extraction: "${text}"`),
            alarmTime: t.alarmTime || undefined,
          }));
          setParsedTasks(formatted);
          setAiState("confirming");
          feedbackSpeak(formatted.length);
          return;
        }
      } catch (err) {
        console.warn("Ollama parsing failed, falling back to local rule-based engine:", err);
      }
    }

    // Local rule-based fallback
    const result = localNlpParse(text, todayStr, speakingLanguage);
    setParsedTasks(result);
    
    if (result.length > 0) {
      setAiState("confirming");
      feedbackSpeak(result.length);
    } else {
      errorSpeak();
      setAiState("idle");
    }
  };

  useEffect(() => {
    processTranscriptRef.current = processTranscript;
  }, [processTranscript]);

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
        title={language === "id" ? "Tanya Asisten Suara" : "Ask Voice Assistant"}
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
                  <span className="font-bold text-xs uppercase tracking-wider">{language === "id" ? "Asisten Suara" : "Voice Assistant"}</span>
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
                  <h4 className="font-bold border-b border-[#4d3227] pb-1 uppercase">{language === "id" ? "Pengaturan" : "Settings"}</h4>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold">{language === "id" ? "Penyedia Suara:" : "Voice Provider:"}</label>
                    <select
                      value={voiceAiProvider}
                      onChange={(e) => updateVoiceSettings({ voiceAiProvider: e.target.value as any })}
                      className="p-1.5 bg-[#f4ecd8] border-2 border-[#4d3227] outline-none"
                    >
                      <option value="local">{language === "id" ? "Offline Bawaan (Ringan & Cepat)" : "Offline Local (Fast)"}</option>
                      <option value="webllm">{language === "id" ? "WebLLM (Browser Offline / APK)" : "WebLLM (Browser Offline / APK)"}</option>
                      <option value="ollama">Ollama LLM (Lokal di PC Anda / PC Local)</option>
                    </select>
                  </div>

                  {voiceAiProvider === "webllm" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold">{language === "id" ? "Model WebLLM:" : "WebLLM Model:"}</label>
                      <select
                        value={webLlmModel}
                        onChange={(e) => updateVoiceSettings({ webLlmModel: e.target.value })}
                        className="p-1.5 bg-[#f4ecd8] border-2 border-[#4d3227] outline-none font-mono text-[11px]"
                      >
                        <option value="Qwen2.5-0.5B-Instruct-q4f16_1-MLC">Qwen 2.5 0.5B (~350MB, Recommended)</option>
                        <option value="SmolLM2-135M-Instruct-q4f16_1-MLC">SmolLM2 135M (~100MB, Ultra Light)</option>
                      </select>
                      <div className="text-[10px] text-[#4d3227]/80 leading-snug mt-1 italic">
                        {language === "id" 
                          ? "*Membutuhkan browser dengan dukungan WebGPU (Chrome, Edge, Opera, dll) dan akan memakan kuota saat unduhan pertama." 
                          : "*Requires WebGPU-enabled browser (Chrome, Edge, etc) and uses bandwidth only on first load."}
                      </div>
                    </div>
                  )}

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
                    {language === "id" ? "Simpan & Tutup" : "Save & Close"}
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
                    {aiState === "listening" ? "Listening..." : aiState === "processing" ? "Processing..." : (language === "id" ? "Asisten Suara" : "Voice Assistant")}
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
              {/* WebLLM Loading Progress */}
              {webLlmLoading && (
                <div className="bg-[#e5cda3] p-4 border-2 border-[#4d3227] mb-4 space-y-2">
                  <div className="flex justify-between text-xs font-bold font-mono">
                    <span>{language === "id" ? "Memuat Model (Offline)..." : "Loading Model (Offline)..."}</span>
                    <span>{webLlmProgressPercent}%</span>
                  </div>
                  <div className="w-full h-4 bg-[#f4ecd8] border-2 border-[#4d3227] p-0.5 relative">
                    <div 
                      className="h-full bg-[#ab7052] transition-all duration-300" 
                      style={{ width: `${webLlmProgressPercent}%` }} 
                    />
                  </div>
                  <div className="text-[10px] text-[#4d3227] leading-relaxed break-all font-mono">
                    {webLlmProgress}
                  </div>
                  <div className="text-[9px] text-[#4d3227]/70 font-sans italic">
                    {language === "id" 
                      ? "*Unduhan pertama berkisar antara 100MB - 350MB dan akan disimpan di memori browser." 
                      : "*First-time download is approx. 100MB - 350MB and will be cached in your browser."}
                  </div>
                </div>
              )}

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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={isListening ? handleStopListening : handleStartListening}
                      disabled={webLlmLoading}
                      className={`h-16 w-16 rounded-full border-4 border-[#4d3227] shadow-[2px_2px_0px_#4d3227] flex items-center justify-center transition-all ${
                        webLlmLoading ? "bg-gray-400 text-gray-700 opacity-60 cursor-not-allowed" :
                        isListening ? "bg-rose-500 text-white animate-pulse" : "bg-[#bc8265] text-white hover:scale-105"
                      }`}
                    >
                      {webLlmLoading ? <RefreshCw className="h-6 w-6 animate-spin" /> : isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>
                    
                    {/* Speaking Language Selector */}
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                      <span className="opacity-75">{language === "id" ? "Bahasa Ucapan:" : "Speaking Lang:"}</span>
                      <select
                        value={speakingLanguage}
                        onChange={(e) => setSpeakingLanguage(e.target.value)}
                        disabled={isListening || webLlmLoading}
                        className="bg-[#e5cda3] border border-[#4d3227] px-1 py-0.5 outline-none text-[#4d3227] rounded-none cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                        <option value="ja">日本語 (Japanese)</option>
                        <option value="ar">العربية (Arabic)</option>
                        <option value="zh">中文 (Chinese)</option>
                        <option value="ko">한국어 (Korean)</option>
                      </select>
                    </div>
                  </div>
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
