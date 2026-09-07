import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Cpu,
  Brain,
  Volume2,
  Hand,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Bot,
  Sparkles,
  ArrowRight,
  Activity,
  Server,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Scan,
  Coins,
  FileText,
  Radio,
  Eye,
  Lock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { Card, Badge, Button, StatusIndicator } from "../components/ui";

const PIPELINE_STEPS = [
  {
    id: "camera",
    num: "01",
    icon: Camera,
    title_en: "Hardware Video Ingest",
    title_ur: "لائیو کیمرہ ان پٹ",
    desc_en: "High-throughput raw frame capture via WebRTC MediaStream at 30 FPS with zero cloud transmission.",
    desc_ur: "ڈیوائس کے کیمرے سے ۳۰ فریم فی سیکنڈ پر براہِ راست ویڈیو فیڈ، بغیر کلاؤڈ تاخیر۔",
    tech: "MediaStream API",
    metric: "30 FPS Local Feed",
  },
  {
    id: "models",
    num: "02",
    icon: Cpu,
    title_en: "On-Device Neural Engine",
    title_ur: "آن ڈیوائس نیورل انجن",
    desc_en: "Local Wasm & WebGL hardware acceleration executing neural graphs directly in the browser.",
    desc_ur: "براؤزر میں براہِ راست تیز رفتار مصنوعی ذہانت (ONNX اور TF.js) بغیر انٹرنیٹ تاخیر۔",
    tech: "ONNX Runtime Web",
    metric: "< 14ms Inference",
  },
  {
    id: "understanding",
    num: "03",
    icon: Brain,
    title_en: "Multimodal Classification",
    title_ur: "کثیر المقاصد فہم",
    desc_en: "Simultaneous spatial detection: 21 MediaPipe hand joints, PKR banknotes, and printed text OCR.",
    desc_ur: "اشاروں، پاکستانی روپے کے نوٹوں، اور لکھی ہوئی تحریر کی درست اور بیک وقت شناخت۔",
    tech: "MediaPipe + OCR",
    metric: "21 Hand Landmarks",
  },
  {
    id: "action",
    num: "04",
    icon: Volume2,
    title_en: "Bilingual Speech Feedback",
    title_ur: "صوتی اور بصری رہنمائی",
    desc_en: "Instant natural voice output in Urdu and English paired with accessible visual HUD overlays.",
    desc_ur: "اردو اور انگریزی میں قدرتی صوتی آواز اور اسکرین پر واضح رہنمائی۔",
    tech: "Web Speech API",
    metric: "Urdu + English TTS",
  },
];

const FEATURES = [
  {
    to: "/vision",
    icon: Camera,
    key: "nav_vision",
    title_en: "Spatial Vision Intelligence",
    title_ur: "بصری رہنمائی اور منظر فہم",
    desc_en: "Continuous 3D spatial narration, custom object memory, and real-time PKR currency classification.",
    desc_ur: "کیمرہ سے اپنے ارد گرد، اشیاء، اور پاکستانی کرنسی نوٹ سنیں اور پہچانیں۔",
    tag_en: "Vision AI",
    tag_ur: "بصری مدد",
    tech: "COCO-SSD + PKR ONNX",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    iconBg: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
    accentBorder: "hover:border-emerald-500/80 hover:shadow-glow-teal",
  },
  {
    to: "/sign",
    icon: Hand,
    key: "nav_sign",
    title_en: "SignTalk PSL Recognition",
    title_ur: "پاکستان اشاروں کی زبان (PSL)",
    desc_en: "Real-time Pakistan Sign Language gesture classification powered by 21 hand joint tracking.",
    desc_ur: "پاکستان اشاروں کی زبان کی فوری شناخت، مشق اور اردو میں صوتی ترجمہ۔",
    tag_en: "Sign AI",
    tag_ur: "اشاروں کی زبان",
    tech: "MediaPipe + PSL ONNX",
    gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
    iconBg: "bg-amber-50 text-amber-700 border border-amber-200/80",
    accentBorder: "hover:border-amber-500/80 hover:shadow-glow-gold",
  },
  {
    to: "/text-reader",
    icon: BookOpen,
    key: "nav_text_reader",
    title_en: "Text Reader & Signboard OCR",
    title_ur: "کتابیں اور تحریر پڑھنے کا آلہ",
    desc_en: "Point device camera at printed books, packaging, or street signs to hear text read aloud instantly.",
    desc_ur: "کتابیں، سائن بورڈز، اور لکھی ہوئی تحریر کو کیمرے سے فوری سنیں۔",
    tag_en: "OCR Reader",
    tag_ur: "مطالعہ",
    tech: "Tesseract.js Engine",
    gradient: "from-sky-500/10 via-blue-500/5 to-transparent",
    iconBg: "bg-sky-50 text-sky-700 border border-sky-200/80",
    accentBorder: "hover:border-sky-500/80",
  },
  {
    to: "/learning",
    icon: GraduationCap,
    key: "nav_learning",
    title_en: "Interactive Sign Academy",
    title_ur: "اشارے سیکھنے کی اکیڈمی",
    desc_en: "Curriculum of Pakistan Sign Language digits, alphabets, and essential daily communication signs.",
    desc_ur: "ہندسے، حروف تہجی، اور روزمرہ کے اشارے مرحلہ وار سیکھیں اور مکمل کریں۔",
    tag_en: "Curriculum",
    tag_ur: "تعلیم",
    tech: "Gamified PSL Studio",
    gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
    iconBg: "bg-teal-50 text-teal-700 border border-teal-200/80",
    accentBorder: "hover:border-teal-500/80",
  },
  {
    to: "/chat",
    icon: MessageSquare,
    key: "nav_chat",
    title_en: "Accessible Messaging & Calls",
    title_ur: "پیغامات اور ویڈیو کالز",
    desc_en: "Inclusive chat with voice notes, video snippets, WebRTC calling, and camera detection cards.",
    desc_ur: "متن، صوتی پیغامات، ویڈیو، اور شناخت کر کے براہ راست بھیجیں۔",
    tag_en: "Connect",
    tag_ur: "رابطہ",
    tech: "WebRTC + Socket.IO",
    gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
    iconBg: "bg-purple-50 text-purple-700 border border-purple-200/80",
    accentBorder: "hover:border-purple-500/80",
  },
  {
    to: "/chat?assistant=1",
    icon: Bot,
    key: "aiden_assistant",
    title_en: "AIDEN Multimodal Copilot",
    title_ur: "AIDEN اے آئی اسسٹنٹ",
    desc_en: "Conversational multimodal assistant for immediate speech guidance and automatic tool routing.",
    desc_ur: "فوری صوتی اور تحریری رہنمائی کے لیے آپ کا ذاتی معاون ساتھی۔",
    tag_en: "AI Assistant",
    tag_ur: "مددگار",
    tech: "LLM Agent + Tool Router",
    gradient: "from-aiden-primary/15 via-aiden-accent/15 to-transparent",
    iconBg: "bg-gradient-to-tr from-aiden-primary-light to-aiden-accent-light text-aiden-primary border border-aiden-accent/30",
    accentBorder: "hover:border-aiden-accent hover:shadow-glow-gold",
  },
];

export default function Home() {
  const { t, language } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isUrdu = language === "ur";

  const [activeStep, setActiveStep] = useState(0);
  const [systemStatus, setSystemStatus] = useState({
    backend: "checking",
    speech: "checking",
    camera: "checking",
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/health")
      .then((r) => (r.ok ? "ok" : "down"))
      .catch(() => "down")
      .then((val) => mounted && setSystemStatus((s) => ({ ...s, backend: val })));

    setSystemStatus((s) => ({
      ...s,
      speech: "speechSynthesis" in window ? "ok" : "down",
      camera: navigator.mediaDevices?.getUserMedia ? "ok" : "down",
    }));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full space-y-12">
      {/* Hero Command Deck */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-aiden-border/70 bg-gradient-to-br from-white via-aiden-surface to-aiden-primary-light/20 p-6 sm:p-8 lg:p-10 shadow-card">
        {/* Soft background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-aiden-primary/10 via-aiden-accent/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-400/10 via-aiden-primary/5 to-transparent rounded-full blur-2xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Mission, Headlines & Action Launchers (7 cols on lg) */}
          <div className="lg:col-span-7 text-left space-y-5">
            {/* Status Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aiden-primary/10 border border-aiden-primary/25 text-xs font-bold text-aiden-primary shadow-subtle">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>ONNX WebGL Engine Active</span>
              </div>

              <Badge variant="accent" size="sm" icon={<Sparkles className="w-3 h-3 text-aiden-text-primary" />}>
                AIDEN v2.0
              </Badge>

              <Badge variant="default" size="sm">
                {t(`role_${user?.disability_type || "none"}`)}
              </Badge>
            </div>

            {/* Main Headline */}
            <div>
              <h1
                className={`font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-aiden-text-primary tracking-tight leading-[1.15] ${
                  isUrdu ? "font-urdu text-4xl sm:text-5xl" : ""
                }`}
              >
                {isUrdu ? (
                  <>
                    خوش آمدید، <span className="text-aiden-primary">{user?.name || "صارف"}</span>
                    <br />
                    <span className="bg-gradient-to-r from-aiden-primary via-emerald-600 to-amber-600 bg-clip-text text-transparent">
                      آن ڈیوائس اسسٹو اے آئی پلیٹ فارم
                    </span>
                  </>
                ) : (
                  <>
                    Next-Gen Accessibility Powered by{" "}
                    <span className="bg-gradient-to-r from-aiden-primary via-emerald-700 to-amber-600 bg-clip-text text-transparent">
                      On-Device AI
                    </span>
                  </>
                )}
              </h1>
              <p
                className={`mt-3 text-sm sm:text-base text-aiden-text-secondary leading-relaxed max-w-xl ${
                  isUrdu ? "font-urdu text-lg" : ""
                }`}
              >
                {isUrdu
                  ? "پاکستانی کرنسی نوٹ کی شناخت، اشاروں کی زبان (PSL) کا ترجمہ، اور دو لسانی صوتی رہنمائی — مکمل رازداری اور صفر کلاؤڈ تاخیر کے ساتھ۔"
                  : `Welcome back, ${user?.name || "Friend"}. Real-time edge neural inference for vision, Pakistani Sign Language (PSL), currency verification, and bilingual voice guidance.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="ai"
                size="lg"
                onClick={() => navigate("/vision")}
                icon={<Camera className="w-5 h-5" />}
                className="font-bold px-6 shadow-glow-gold hover:scale-[1.02] transition-transform"
              >
                {isUrdu ? "کیمرہ ویژن اسٹوڈیو" : "Launch Vision Studio"}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/sign")}
                icon={<Hand className="w-5 h-5" />}
                className="font-semibold px-5 border-aiden-primary/30 hover:border-aiden-primary"
              >
                {isUrdu ? "اشاروں کی زبان (PSL)" : "PSL Sign Talk"}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate("/chat?assistant=1")}
                icon={<Bot className="w-5 h-5 text-aiden-primary" />}
                className="text-xs sm:text-sm font-semibold text-aiden-primary hover:bg-aiden-primary-light/50"
              >
                {isUrdu ? "اے آئی اسسٹنٹ" : "AI Copilot"}
              </Button>
            </div>

            {/* 4 Hardware / Capability Badges Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
              <div className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-aiden-border/70 shadow-subtle flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-aiden-text-primary leading-none">&lt; 15ms</div>
                  <div className="text-[10px] text-aiden-text-muted mt-0.5">Zero Cloud Lag</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-aiden-border/70 shadow-subtle flex items-center gap-2">
                <Hand className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-aiden-text-primary leading-none">21-Joint</div>
                  <div className="text-[10px] text-aiden-text-muted mt-0.5">3D Hand Mesh</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-aiden-border/70 shadow-subtle flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-aiden-primary shrink-0" />
                <div>
                  <div className="text-xs font-bold text-aiden-text-primary leading-none">100% Local</div>
                  <div className="text-[10px] text-aiden-text-muted mt-0.5">Privacy Sealed</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-aiden-border/70 shadow-subtle flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-aiden-text-primary leading-none">EN + اردو</div>
                  <div className="text-[10px] text-aiden-text-muted mt-0.5">Bilingual Voice</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Copilot Showcase Card (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-gradient-to-b from-white/95 via-white/80 to-aiden-surface-secondary/90 border border-aiden-border p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-aiden-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                  <span className="text-xs font-bold uppercase tracking-wider text-aiden-text-primary">
                    {isUrdu ? "AIDEN اسسٹنٹ کونسول" : "AIDEN Copilot Active"}
                  </span>
                </div>
                <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                  WebAssembly JSEP
                </Badge>
              </div>

              {/* Avatar + Sound Wave Visualization */}
              <div className="flex items-center justify-center gap-4 py-2">
                {/* Wave bars left */}
                <div className="flex items-end gap-1 h-12">
                  <span className="w-1 bg-aiden-primary/40 rounded-full h-3 animate-pulse" />
                  <span className="w-1 bg-aiden-accent rounded-full h-7 animate-pulse delay-75" />
                  <span className="w-1 bg-aiden-primary rounded-full h-10 animate-pulse delay-150" />
                  <span className="w-1 bg-emerald-500/70 rounded-full h-5 animate-pulse delay-100" />
                </div>

                {/* Avatar with glowing ring */}
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-tr from-aiden-primary/30 via-aiden-accent/30 to-emerald-400/20 rounded-full blur-md animate-pulse" />
                  <div className="relative p-1.5 rounded-full bg-gradient-to-b from-white to-aiden-primary-light/40 border-2 border-aiden-border/80 shadow-md">
                    <Avatar expression="hero" size={105} className="mx-auto select-none" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-aiden-accent border-2 border-white flex items-center justify-center text-xs shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-aiden-text-primary" />
                  </span>
                </div>

                {/* Wave bars right */}
                <div className="flex items-end gap-1 h-12">
                  <span className="w-1 bg-emerald-500/70 rounded-full h-5 animate-pulse delay-100" />
                  <span className="w-1 bg-aiden-primary rounded-full h-10 animate-pulse delay-150" />
                  <span className="w-1 bg-aiden-accent rounded-full h-7 animate-pulse delay-75" />
                  <span className="w-1 bg-aiden-primary/40 rounded-full h-3 animate-pulse" />
                </div>
              </div>

              {/* Dynamic Copilot Speech Bubble */}
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-aiden-primary-light/60 via-white to-aiden-accent-light/40 border border-aiden-primary/20 shadow-subtle text-left">
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-aiden-primary uppercase tracking-wide">
                  <Bot className="w-3.5 h-3.5" />
                  <span>{isUrdu ? "اے آئی اسسٹنٹ پیام:" : "Neural Assist Prompt"}</span>
                </div>
                <p className={`text-xs sm:text-sm text-aiden-text-primary leading-relaxed ${isUrdu ? "font-urdu text-base" : ""}`}>
                  {isUrdu
                    ? "”میں آپ کی مدد کے لیے تیار ہوں۔ کیمرہ آن کریں یا اشاروں کی مشق شروع کریں۔“"
                    : "\"Ready to assist! Point your camera at Pakistani currency notes, sign gestures, or printed text to begin live inference.\""}
                </p>
              </div>

              {/* Quick 1-Click Launchers inside Card */}
              <div className="mt-4 pt-3 border-t border-aiden-border-subtle">
                <div className="text-[11px] font-semibold text-aiden-text-muted mb-2 text-left">
                  {isUrdu ? "فوری ماڈیولز:" : "Instant Launch Tools:"}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate("/vision")}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/90 hover:bg-aiden-primary-light/50 border border-aiden-border/70 hover:border-aiden-primary text-xs font-semibold text-aiden-text-primary transition-colors text-left"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{isUrdu ? "پاکستانی روپیہ" : "PKR Currency"}</span>
                  </button>
                  <button
                    onClick={() => navigate("/sign")}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/90 hover:bg-aiden-primary-light/50 border border-aiden-border/70 hover:border-aiden-primary text-xs font-semibold text-aiden-text-primary transition-colors text-left"
                  >
                    <Hand className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{isUrdu ? "اشارے (PSL)" : "PSL Sign Talk"}</span>
                  </button>
                  <button
                    onClick={() => navigate("/text")}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/90 hover:bg-aiden-primary-light/50 border border-aiden-border/70 hover:border-aiden-primary text-xs font-semibold text-aiden-text-primary transition-colors text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{isUrdu ? "متن ریڈر" : "OCR Text Reader"}</span>
                  </button>
                  <button
                    onClick={() => navigate("/chat?assistant=1")}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/90 hover:bg-aiden-primary-light/50 border border-aiden-border/70 hover:border-aiden-primary text-xs font-semibold text-aiden-text-primary transition-colors text-left"
                  >
                    <Bot className="w-3.5 h-3.5 text-aiden-primary shrink-0" />
                    <span className="truncate">{isUrdu ? "چیٹ وائس" : "Copilot Chat"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Architecture Pipeline (For Hackathon Judges) */}
      <section className="bg-aiden-surface border border-aiden-border/80 rounded-aiden-xl p-5 sm:p-7 shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-aiden-border-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-aiden-primary">
                {isUrdu ? "مصنوعی ذہانت کا ورک فلو" : "Interactive Perception Pipeline"}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-aiden-accent animate-ping" />
            </div>
            <h2 className={`text-lg sm:text-xl font-display font-bold text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
              {isUrdu ? "AIDEN کیسے دیکھتا، سمجھتا اور بولتا ہے" : "How AIDEN Perceives, Understands & Speaks"}
            </h2>
          </div>
          <span className="text-xs text-aiden-text-muted">
            {isUrdu ? "مرحلہ چنیں:" : "Tap a step to inspect:"}
          </span>
        </div>

        {/* 4 Pipeline Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {PIPELINE_STEPS.map((step, idx) => {
            const isSelected = activeStep === idx;
            const StepIcon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-aiden-lg text-left transition-all duration-200 border relative overflow-hidden ${
                  isSelected
                    ? "bg-gradient-to-br from-aiden-primary-light/80 to-white border-aiden-primary shadow-card ring-2 ring-aiden-primary/25"
                    : "bg-aiden-surface-secondary/70 border-aiden-border/70 hover:border-aiden-primary/40 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-aiden-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-aiden-primary text-white shadow-sm"
                        : "bg-white text-aiden-primary border border-aiden-border/60"
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected ? "text-aiden-primary" : "text-aiden-text-muted"
                    }`}
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className={`text-xs sm:text-sm font-bold truncate text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
                  {isUrdu ? step.title_ur : step.title_en}
                </h3>
                <span className="text-[10px] text-aiden-text-muted block mt-1 font-mono">
                  {step.tech}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Callout */}
        <div className="p-4 sm:p-5 rounded-aiden-lg bg-gradient-to-r from-aiden-primary-subtle via-white to-aiden-accent-light/30 border border-aiden-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="primary" size="sm">
                Step {PIPELINE_STEPS[activeStep].num}
              </Badge>
              <h4 className="font-bold text-sm sm:text-base text-aiden-text-primary">
                {isUrdu ? PIPELINE_STEPS[activeStep].title_ur : PIPELINE_STEPS[activeStep].title_en}
              </h4>
            </div>
            <p className={`text-xs sm:text-sm text-aiden-text-secondary leading-relaxed ${isUrdu ? "font-urdu text-base" : ""}`}>
              {isUrdu ? PIPELINE_STEPS[activeStep].desc_ur : PIPELINE_STEPS[activeStep].desc_en}
            </p>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <Badge variant="accent" size="sm" className="shadow-subtle font-mono">
              {PIPELINE_STEPS[activeStep].tech}
            </Badge>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {PIPELINE_STEPS[activeStep].metric}
            </span>
          </div>
        </div>
      </section>

      {/* Feature Navigation Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-aiden-text-muted">
            {isUrdu ? "اہم ٹولز اور خدمات" : "Accessibility Workstations"}
          </h2>
          <span className="text-xs text-aiden-text-muted font-mono">
            {FEATURES.length} {isUrdu ? "ٹولز تیار ہیں" : "modules active"}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f) => {
            const FeatureIcon = f.icon;
            return (
              <Link key={f.to} to={f.to} className="group focus-visible:outline-none block">
                <Card
                  variant="interactive"
                  padding="md"
                  className={`h-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-b ${f.gradient} ${f.accentBorder}`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3.5">
                      <span className={`w-12 h-12 rounded-aiden-lg ${f.iconBg} flex items-center justify-center group-hover:scale-110 transition-all duration-200 shadow-sm`}>
                        <FeatureIcon className="w-6 h-6" />
                      </span>
                      <Badge variant="default" size="sm">
                        {isUrdu ? f.tag_ur : f.tag_en}
                      </Badge>
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-bold text-aiden-text-primary group-hover:text-aiden-primary transition-colors mb-1.5">
                      {f.title_en ? (isUrdu ? f.title_ur : f.title_en) : t(f.key)}
                    </h3>

                    <p
                      className={`text-xs sm:text-sm text-aiden-text-secondary leading-relaxed ${
                        isUrdu ? "font-urdu" : ""
                      }`}
                    >
                      {isUrdu ? f.desc_ur : f.desc_en}
                    </p>

                    {f.tech && (
                      <div className="mt-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/80 text-aiden-primary border border-aiden-border/70 shadow-2xs">
                          {f.tech}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-aiden-border-subtle flex items-center justify-between text-xs font-bold text-aiden-primary group-hover:text-aiden-primary-hover">
                    <span>{isUrdu ? "کھولیں" : "Launch Workstation"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Dynamic Live Status Section */}
      <section className="bg-aiden-surface border border-aiden-border/80 rounded-aiden-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-aiden-border-subtle">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-aiden-primary" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-aiden-text-primary">
              {isUrdu ? "ڈیوائس اور سسٹم کنکشن" : "Live Device & Engine Connectivity"}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-aiden-text-muted">Real-time Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-aiden-lg bg-aiden-surface-secondary/80 border border-aiden-border-subtle flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-aiden-primary" />
              <span className="text-xs font-semibold text-aiden-text-primary">
                {isUrdu ? "سرور رابطہ:" : "Backend API:"}
              </span>
            </div>
            <StatusIndicator status={systemStatus.backend} />
          </div>

          <div className="p-3.5 rounded-aiden-lg bg-aiden-surface-secondary/80 border border-aiden-border-subtle flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-aiden-primary" />
              <span className="text-xs font-semibold text-aiden-text-primary">
                {isUrdu ? "آواز کا انجن:" : "Speech Synthesizer:"}
              </span>
            </div>
            <StatusIndicator status={systemStatus.speech} />
          </div>

          <div className="p-3.5 rounded-aiden-lg bg-aiden-surface-secondary/80 border border-aiden-border-subtle flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-aiden-primary" />
              <span className="text-xs font-semibold text-aiden-text-primary">
                {isUrdu ? "کیمرہ ہارڈویئر:" : "Camera Sensor:"}
              </span>
            </div>
            <StatusIndicator status={systemStatus.camera} />
          </div>
        </div>
      </section>
    </div>
  );
}
