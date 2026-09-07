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
    title_en: "Live Camera Input",
    title_ur: "لائیو کیمرہ ان پٹ",
    desc_en: "Continuous local video stream captured from device hardware at 30 FPS.",
    desc_ur: "ڈیوائس کے کیمرے سے ۳۰ فریم فی سیکنڈ پر براہِ راست ویڈیو فیڈ۔",
    tech: "MediaStream API",
  },
  {
    id: "models",
    num: "02",
    icon: Cpu,
    title_en: "On-Device Neural Engine",
    title_ur: "آن ڈیوائس نیورل انجن",
    desc_en: "Zero-cloud-latency inference via ONNX Runtime Web and TensorFlow.js.",
    desc_ur: "براؤزر میں تیز رفتار مصنوعی ذہانت (ONNX اور TF.js) بغیر انٹرنیٹ تاخیر کے۔",
    tech: "Wasm / WebGL",
  },
  {
    id: "understanding",
    num: "03",
    icon: Brain,
    title_en: "Multimodal Perception",
    title_ur: "کثیر المقاصد فہم",
    desc_en: "Classifies PSL hand joints, PKR banknotes, and printed textual strings.",
    desc_ur: "اشاروں، پاکستانی روپے کے نوٹوں، اور لکھی ہوئی تحریر کی درست شناخت۔",
    tech: "MediaPipe + OCR",
  },
  {
    id: "action",
    num: "04",
    icon: Volume2,
    title_en: "Accessible Feedback",
    title_ur: "رسائی ایکشن و آواز",
    desc_en: "Instant natural speech narration in English/Urdu and visual feedback.",
    desc_ur: "اردو اور انگریزی میں فوری صوتی آواز اور اسکرین پر رہنمائی۔",
    tech: "SpeechSynthesis",
  },
];

const FEATURES = [
  {
    to: "/vision",
    icon: Camera,
    key: "nav_vision",
    desc_en: "Point camera to detect surroundings, objects, and PKR banknotes.",
    desc_ur: "کیمرہ سے اپنے ارد گرد، اشیاء، اور کرنسی نوٹ سنیں۔",
    tag_en: "Vision AI",
    tag_ur: "بصری مدد",
  },
  {
    to: "/sign",
    icon: Hand,
    key: "nav_sign",
    desc_en: "Real-time Pakistan Sign Language (PSL) gesture recognition.",
    desc_ur: "پاکستان اشاروں کی زبان کی فوری شناخت اور مشق۔",
    tag_en: "Sign AI",
    tag_ur: "اشاروں کی زبان",
  },
  {
    to: "/text-reader",
    icon: BookOpen,
    key: "nav_text_reader",
    desc_en: "Read printed books, packaging, and signboards aloud in real-time.",
    desc_ur: "کتابیں، سائن بورڈز، اور لکھی ہوئی تحریر سنیں۔",
    tag_en: "OCR Reader",
    tag_ur: "مطالعہ",
  },
  {
    to: "/learning",
    icon: GraduationCap,
    key: "nav_learning",
    desc_en: "Master PSL signs, alphabets, and numbers with interactive feedback.",
    desc_ur: "ہندسے، حروف تہجی، اور روزمرہ کے اشارے مرحلہ وار سیکھیں۔",
    tag_en: "Curriculum",
    tag_ur: "تعلیم",
  },
  {
    to: "/chat",
    icon: MessageSquare,
    key: "nav_chat",
    desc_en: "Accessible messaging with voice notes, video, and live detection cards.",
    desc_ur: "متن، صوتی پیغامات، ویڈیو، اور شناخت کر کے بھیجیں۔",
    tag_en: "Connect",
    tag_ur: "رابطہ",
  },
  {
    to: "/chat?assistant=1",
    icon: Bot,
    key: "aiden_assistant",
    title_en: "AIDEN AI Assistant",
    title_ur: "AIDEN اے آئی اسسٹنٹ",
    desc_en: "Conversational multimodal assistant for immediate voice and text guidance.",
    desc_ur: "فوری صوتی اور تحریری رہنمائی کے لیے آپ کا ذاتی ساتھی۔",
    tag_en: "Assistant",
    tag_ur: "مددگار",
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 max-w-5xl mx-auto w-full space-y-10">
      {/* Hero Command Center */}
      <section className="text-center relative pt-2">
        <div className="relative inline-block mb-4">
          <div className="relative p-2 rounded-full bg-gradient-to-b from-aiden-primary-light to-transparent">
            <Avatar expression="hero" size={150} className="mx-auto drop-shadow-sm select-none" />
          </div>
          <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-aiden-accent border-2 border-white flex items-center justify-center text-xs shadow-card animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-aiden-text-primary" />
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="primary" size="md">
            {t(`role_${user?.disability_type || "none"}`)}
          </Badge>
          <Badge variant="accent" size="md">
            AIDEN v2.0
          </Badge>
          <Badge variant="default" size="md">
            Hackathon Edition
          </Badge>
        </div>

        <h1
          className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-aiden-text-primary mb-3 tracking-tight ${
            isUrdu ? "font-urdu text-4xl sm:text-5xl" : ""
          }`}
        >
          {isUrdu ? `خوش آمدید، ${user?.name}` : `Welcome back, ${user?.name}`}
        </h1>

        <p
          className={`text-sm sm:text-base text-aiden-text-secondary max-w-xl mx-auto leading-relaxed mb-6 ${
            isUrdu ? "font-urdu text-lg" : ""
          }`}
        >
          {t("tagline")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="ai"
            size="lg"
            onClick={() => navigate("/vision")}
            icon={<Camera className="w-5 h-5" />}
            className="font-bold shadow-card px-7"
          >
            {isUrdu ? "کیمرہ گائیڈ آزمائیں" : "Launch Camera Vision"}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/sign")}
            icon={<Hand className="w-5 h-5" />}
            className="font-semibold shadow-subtle px-6"
          >
            {isUrdu ? "اشاروں کی زبان (PSL)" : "Explore Sign Talk"}
          </Button>
        </div>
      </section>

      {/* Interactive AI Architecture Pipeline (For Hackathon Judges) */}
      <section className="bg-aiden-surface border border-aiden-border rounded-aiden-xl p-5 sm:p-7 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-aiden-border-subtle">
          <div>
            <div className="flex items-center gap-2">
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
            {isUrdu ? "مرحلہ چنیں:" : "Tap a step to explore:"}
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
                className={`p-3.5 rounded-aiden-md text-left transition-all duration-200 border relative ${
                  isSelected
                    ? "bg-aiden-primary-light/70 border-aiden-primary shadow-subtle ring-2 ring-aiden-primary/20"
                    : "bg-aiden-surface-secondary border-aiden-border/70 hover:border-aiden-primary/40 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-aiden-sm flex items-center justify-center ${
                      isSelected
                        ? "bg-aiden-primary text-white"
                        : "bg-aiden-surface text-aiden-primary border border-aiden-border/60"
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
        <div className="p-4 rounded-aiden-md bg-aiden-primary-subtle border border-aiden-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="primary" size="sm">
                Step {PIPELINE_STEPS[activeStep].num}
              </Badge>
              <h4 className="font-bold text-sm text-aiden-text-primary">
                {isUrdu ? PIPELINE_STEPS[activeStep].title_ur : PIPELINE_STEPS[activeStep].title_en}
              </h4>
            </div>
            <p className={`text-xs sm:text-sm text-aiden-text-secondary ${isUrdu ? "font-urdu text-base" : ""}`}>
              {isUrdu ? PIPELINE_STEPS[activeStep].desc_ur : PIPELINE_STEPS[activeStep].desc_en}
            </p>
          </div>
          <Badge variant="accent" size="sm" className="self-start sm:self-center shrink-0">
            {PIPELINE_STEPS[activeStep].tech}
          </Badge>
        </div>
      </section>

      {/* Feature Navigation Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-aiden-text-muted">
            {isUrdu ? "اہم ٹولز اور خدمات" : "Accessibility Workstations"}
          </h2>
          <span className="text-xs text-aiden-text-muted font-mono">
            {FEATURES.length} {isUrdu ? "ٹولز تیار ہیں" : "modules loaded"}
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
                  className="h-full flex flex-col justify-between group-hover:border-aiden-primary/60"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="w-12 h-12 rounded-aiden-md bg-aiden-primary-light/80 text-aiden-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-aiden-primary group-hover:text-white transition-all duration-200 shadow-subtle">
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
                  </div>

                  <div className="mt-4 pt-3 border-t border-aiden-border-subtle flex items-center justify-between text-xs font-bold text-aiden-primary group-hover:text-aiden-primary-hover">
                    <span>{isUrdu ? "کھولیں" : "Launch"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Dynamic Live Status Section */}
      <section className="bg-aiden-surface border border-aiden-border rounded-aiden-xl p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-aiden-border-subtle">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-aiden-primary" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-aiden-text-primary">
              {isUrdu ? "ڈیوائس اور سسٹم کنکشن" : "Live Device & Engine Connectivity"}
            </h3>
          </div>
          <span className="text-[11px] text-aiden-text-muted">Real-time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-aiden-md bg-aiden-surface-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-aiden-primary" />
              <span className="text-xs font-medium text-aiden-text-primary">
                {isUrdu ? "سرور رابط:" : "Backend API:"}
              </span>
            </div>
            <StatusIndicator status={systemStatus.backend} />
          </div>

          <div className="p-3 rounded-aiden-md bg-aiden-surface-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-aiden-primary" />
              <span className="text-xs font-medium text-aiden-text-primary">
                {isUrdu ? "آواز کا انجن:" : "Speech Synthesizer:"}
              </span>
            </div>
            <StatusIndicator status={systemStatus.speech} />
          </div>

          <div className="p-3 rounded-aiden-md bg-aiden-surface-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-aiden-primary" />
              <span className="text-xs font-medium text-aiden-text-primary">
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
