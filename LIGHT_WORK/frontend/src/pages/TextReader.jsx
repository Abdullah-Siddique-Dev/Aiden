import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { useApp } from "../context/AppContext";
import { useCamera } from "../lib/useCamera";
import { Button, Card, Badge } from "../components/ui";
import {
  Camera,
  Cpu,
  FileText,
  Volume2,
  BookOpen,
  Play,
  Square,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

const SCAN_INTERVAL_MS = 2600;

export default function TextReader() {
  const { language, speak } = useApp();
  const { videoRef, active, error, start, stop } = useCamera(language);

  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const lastSpokenRef = useRef("");
  const loopRef = useRef(null);
  const scanningRef = useRef(false);
  const speakTimeoutRef = useRef(null);

  const isUrdu = language === "ur";

  function speakWithVisual(str) {
    if (!str) return;
    setIsSpeaking(true);
    speak(str);
    clearTimeout(speakTimeoutRef.current);
    const words = str.split(/\s+/).length;
    const duration = Math.max(2000, Math.min(8000, words * 160 + 1000));
    speakTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false);
    }, duration);
  }

  useEffect(() => {
    return () => {
      stop();
      clearTimeout(loopRef.current);
      clearTimeout(speakTimeoutRef.current);
    };
  }, [stop]);

  async function handleStart() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    }
    await start();
    setScanning(true);
    scanningRef.current = true;
    scanLoop();
  }

  function handleStop() {
    setScanning(false);
    scanningRef.current = false;
    clearTimeout(loopRef.current);
    stop();
  }

  async function scanLoop() {
    await scanOnce();
    loopRef.current = setTimeout(() => {
      if (scanningRef.current) scanLoop();
    }, SCAN_INTERVAL_MS);
  }

  async function scanOnce() {
    if (!videoRef.current || busy) return;
    setBusy(true);
    setStatus(isUrdu ? "کیمرے میں تحریر پڑھی جا رہی ہے…" : "Scanning printed text in camera viewport…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const langs = isUrdu ? "urd+eng" : "eng+urd";
      const { data } = await Tesseract.recognize(canvas, langs);
      const found = (data.text || "").replace(/\s+/g, " ").trim();

      if (found && found.length > 2) {
        setText(found);
        setStatus("");
        if (found !== lastSpokenRef.current) {
          lastSpokenRef.current = found;
          speakWithVisual(found.slice(0, 500));
        }
      } else {
        setStatus(isUrdu ? "کوئی تحریر نظر نہیں آ رہی" : "No text detected in view");
      }
    } catch {
      setStatus(isUrdu ? "پڑھنے میں مسئلہ ہوا — کیمرہ تھوڑا قریب لائیں" : "Trouble reading — improve lighting or move camera closer");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  // Determine current workflow state
  let currentStep = "capture";
  if (!active) currentStep = "capture";
  else if (busy) currentStep = "scanning";
  else if (isSpeaking) currentStep = "read_aloud";
  else if (text) currentStep = "text_found";
  else currentStep = "scanning";

  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-2xl sm:text-3xl font-bold text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
              {isUrdu ? "تحریر پڑھنے والا (OCR)" : "Text Reader"}
            </h1>
            <Badge variant="primary" size="sm">
              Live OCR
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-aiden-text-secondary mt-0.5">
            {isUrdu
              ? "کتابوں، سائن بورڈز یا دستاویزات کے سامنے رکھیں — AIDEN خود بخود پڑھ کر سنائے گا"
              : "Point camera at books, product labels, or signs — AIDEN extracts and reads aloud"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-aiden-md bg-aiden-danger-light border border-aiden-danger/25 text-aiden-danger text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-aiden-danger shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* 4-Step OCR Workflow Indicator */}
      <div className="p-3 rounded-aiden-lg bg-aiden-surface border border-aiden-border shadow-subtle flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase text-aiden-text-muted shrink-0 mr-1">
          {isUrdu ? "ورک فلو:" : "OCR Stage:"}
        </span>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-around">
          {[
            { id: "capture", labelEn: "1. Capture", labelUr: "۱. کیمرہ ان پٹ", icon: Camera },
            { id: "scanning", labelEn: "2. Scanning", labelUr: "۲. تحریر کی تلاش", icon: Cpu },
            { id: "text_found", labelEn: "3. Text Found", labelUr: "۳. متن برآمد", icon: FileText },
            { id: "read_aloud", labelEn: "4. Read Aloud", labelUr: "۴. صوتی قرات", icon: Volume2 },
          ].map((st) => {
            const isActive = currentStep === st.id;
            const StepIcon = st.icon;
            return (
              <div
                key={st.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-aiden-primary text-white shadow-sm ring-2 ring-aiden-accent"
                    : "bg-aiden-surface-secondary text-aiden-text-muted"
                }`}
              >
                <StepIcon className="w-3.5 h-3.5" />
                <span className={isUrdu ? "font-urdu" : ""}>
                  {isUrdu ? st.labelUr : st.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Professional Camera Viewport with HUD Corner Brackets & Laser Scan */}
      <Card
        variant="camera"
        padding="none"
        className="aspect-video relative shadow-modal viewfinder-hud"
      >
        <span className="viewfinder-hud-tr" aria-hidden="true" />
        <span className="viewfinder-hud-bl" aria-hidden="true" />

        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Laser scan line when active */}
        {active && <div className="animate-aiden-scan" />}

        {/* Inactive State */}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-6 text-center bg-black/85 z-20">
            <BookOpen className="w-12 h-12 text-white/50 mb-3" aria-hidden="true" />
            <p className="text-xs sm:text-sm max-w-sm font-medium">
              {isUrdu
                ? "کیمرہ فیڈ غیر فعال ہے — شروع کرنے کے لیے نیچے بٹن دبائیں"
                : "Camera inactive — tap Start Reading below to scan printed text"}
            </p>
          </div>
        )}

        {/* Active Scanning Badge */}
        {busy && (
          <div className="absolute top-3.5 right-3.5 z-20 bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-sm">
            <span className="w-2 h-2 rounded-full bg-aiden-accent" />
            <span>{isUrdu ? "تحریر پڑھی جا رہی ہے…" : "Extracting OCR text…"}</span>
          </div>
        )}

        {/* Speaking Audio Equalizer Badge */}
        {isSpeaking && (
          <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-aiden-accent text-aiden-text-primary backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-1 bg-current rounded-full aiden-wave-bar-1" />
              <span className="w-1 bg-current rounded-full aiden-wave-bar-2" />
              <span className="w-1 bg-current rounded-full aiden-wave-bar-3" />
              <span className="w-1 bg-current rounded-full aiden-wave-bar-4" />
            </div>
            <span>Reading Aloud</span>
          </div>
        )}
      </Card>

      {/* Control Buttons Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!active ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleStart}
            icon={<Play className="w-4 h-4" />}
            className="font-bold shadow-sm flex-1 sm:flex-initial"
          >
            {isUrdu ? "شروع کریں" : "Start Reading"}
          </Button>
        ) : (
          <Button
            variant="danger"
            size="md"
            onClick={handleStop}
            icon={<Square className="w-4 h-4" />}
            className="font-bold shadow-sm flex-1 sm:flex-initial"
          >
            {isUrdu ? "روکیں" : "Stop"}
          </Button>
        )}

        {text && (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => speakWithVisual(text.slice(0, 500))}
              icon={<Volume2 className="w-4 h-4" />}
              className="font-semibold shadow-sm"
            >
              {isUrdu ? "دوبارہ سنیں" : "Replay Speech"}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={handleCopy}
              icon={copied ? <Check className="w-4 h-4 text-aiden-success" /> : <Copy className="w-4 h-4" />}
              className="font-semibold"
            >
              {copied ? "Copied!" : isUrdu ? "کاپی کریں" : "Copy Text"}
            </Button>
          </>
        )}
      </div>

      {status && (
        <p className={`text-xs text-aiden-text-muted italic ${isUrdu ? "font-urdu text-sm" : ""}`}>
          {status}
        </p>
      )}

      {/* Extracted Text Card with Progressive Fade-in */}
      {text && (
        <Card variant="standard" padding="lg" className="shadow-card animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-aiden-border-subtle">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-aiden-primary">
                {isUrdu ? "برآمد شدہ تحریر" : "Extracted Content"}
              </span>
              <Badge variant="accent" size="sm">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </Badge>
            </div>
            <Badge variant="default" size="sm">
              {isUrdu ? "اردو / English" : "Tesseract.js"}
            </Badge>
          </div>

          <p
            className={`text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-aiden-text-primary ${
              isUrdu ? "font-urdu text-xl text-right" : ""
            }`}
          >
            {text}
          </p>
        </Card>
      )}
    </div>
  );
}
