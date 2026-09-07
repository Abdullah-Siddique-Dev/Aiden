import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Card, Button, Input, Select, StatusIndicator, Badge } from "../components/ui";
import { User, Palette, Globe, Accessibility, Activity } from "lucide-react";

const FONT_SIZES = ["small", "medium", "large", "xlarge"];
const ROLES = ["deaf", "mute", "visually_impaired", "student", "caregiver", "teacher", "none"];

function useAppStatus() {
  const [status, setStatus] = useState({
    backend: "checking",
    signRecognition: "checking",
    currencyRecognition: "checking",
    tts: "checking",
    stt: "checking",
    camera: "checking",
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/health")
      .then((r) => (r.ok ? "ok" : "down"))
      .catch(() => "down")
      .then((v) => !cancelled && setStatus((s) => ({ ...s, backend: v })));

    fetch("/models/sign/psl_classifier.onnx", { method: "HEAD" })
      .then((r) => (r.ok ? "ok" : "down"))
      .catch(() => "down")
      .then((v) => !cancelled && setStatus((s) => ({ ...s, signRecognition: v })));

    fetch("/models/currency/currency_model.onnx", { method: "HEAD" })
      .then((r) => (r.ok ? "ok" : "down"))
      .catch(() => "down")
      .then((v) => !cancelled && setStatus((s) => ({ ...s, currencyRecognition: v })));

    setStatus((s) => ({
      ...s,
      tts: "speechSynthesis" in window ? "ok" : "down",
      stt: window.SpeechRecognition || window.webkitSpeechRecognition ? "ok" : "down",
      camera: navigator.mediaDevices?.getUserMedia ? "ok" : "down",
    }));

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs sm:text-sm font-semibold text-aiden-text-primary">{label}</span>
      <StatusIndicator status={value} />
    </div>
  );
}

export default function Settings() {
  const {
    t,
    language,
    setLanguage,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    hasUrduVoice,
  } = useApp();
  const { user, updateProfile } = useAuth();
  const status = useAppStatus();
  const isUrdu = language === "ur";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="primary">AIDEN Preferences</Badge>
          <Badge variant="accent">Accessibility Standards</Badge>
        </div>
        <h1 className={`font-display text-2xl sm:text-3xl font-bold text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
          {t("settings_title")}
        </h1>
        <p className="text-xs sm:text-sm text-aiden-text-secondary mt-1">
          {isUrdu
            ? "اپنی ترجیحات، انٹرفیس کا انداز اور سسٹم کی صحت کا جائزہ لیں"
            : "Customize your profile, visual interface, language, and verify on-device neural engine status"}
        </p>
      </div>

      {/* 1. Profile & Role */}
      <Card variant="standard" padding="lg">
        <h2 className="text-sm sm:text-base font-bold text-aiden-text-primary mb-4 pb-2 border-b border-aiden-border-subtle flex items-center gap-2">
          <User className="w-4 h-4 text-aiden-primary" />
          <span>{isUrdu ? "پروفائل اور صارف کی حیثیت" : "Profile & Role"}</span>
        </h2>
        <div className="space-y-4">
          <Input
            label={t("name")}
            defaultValue={user.name}
            onBlur={(e) => updateProfile({ name: e.target.value })}
            placeholder="Your full name"
          />

          <Select
            label={t("i_am")}
            value={user.disability_type}
            onChange={(e) => updateProfile({ disability_type: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`role_${r}`)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* 2. Appearance */}
      <Card variant="standard" padding="lg">
        <h2 className="text-sm sm:text-base font-bold text-aiden-text-primary mb-4 pb-2 border-b border-aiden-border-subtle flex items-center gap-2">
          <Palette className="w-4 h-4 text-aiden-primary" />
          <span>{isUrdu ? "ظاہری شکل و صورت" : "Appearance & Display"}</span>
        </h2>

        {/* Font Scale */}
        <div className="mb-5">
          <label className="block text-xs sm:text-sm font-semibold text-aiden-text-primary mb-2">
            {t("font_size")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONT_SIZES.map((s) => (
              <Button
                key={s}
                type="button"
                variant={fontSize === s ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFontSize(s)}
                className="justify-center capitalize font-semibold text-xs"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* High Contrast Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-aiden-md bg-aiden-surface-secondary border border-aiden-border-subtle">
          <div>
            <span className="font-bold text-xs sm:text-sm text-aiden-text-primary block">
              {t("high_contrast")}
            </span>
            <span className="text-xs text-aiden-text-secondary">
              {isUrdu
                ? "کم بصارت والے صارفین کے لیے تیز کنٹراسٹ اور گہرے پس منظر"
                : "Deep black background, golden accents, and heightened borders"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            className={`w-12 h-7 rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent ${
              highContrast ? "bg-aiden-primary" : "bg-aiden-border"
            }`}
            role="switch"
            aria-checked={highContrast}
            aria-label={t("high_contrast")}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                highContrast ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* 3. Language Selection */}
      <Card variant="standard" padding="lg">
        <h2 className="text-sm sm:text-base font-bold text-aiden-text-primary mb-4 pb-2 border-b border-aiden-border-subtle flex items-center gap-2">
          <Globe className="w-4 h-4 text-aiden-primary" />
          <span>{t("language")}</span>
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "en", label: "English", sub: "Standard Interface & Speech" },
            { id: "ur", label: "اردو", sub: "نستعلیق رسم الخط اور صوتی ترجمہ" },
          ].map((l) => (
            <Button
              key={l.id}
              type="button"
              variant={language === l.id ? "primary" : "secondary"}
              onClick={() => setLanguage(l.id)}
              className="justify-center py-3 flex-col h-auto"
            >
              <span className="font-bold text-sm sm:text-base">{l.label}</span>
              <span
                className={`text-[11px] opacity-80 ${
                  language === l.id ? "text-white/90" : "text-aiden-text-muted"
                }`}
              >
                {l.sub}
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {/* 4. Accessibility Preferences */}
      <Card variant="standard" padding="lg">
        <h2 className="text-sm sm:text-base font-bold text-aiden-text-primary mb-3 pb-2 border-b border-aiden-border-subtle flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-aiden-primary" />
          <span>{isUrdu ? "رسائی کی خصوصیات" : "Accessibility & Assistive Standards"}</span>
        </h2>

        <div className="space-y-2.5 text-xs sm:text-sm text-aiden-text-secondary leading-relaxed">
          <div className="p-3 rounded-aiden-md bg-aiden-surface-secondary border border-aiden-border-subtle flex items-center justify-between">
            <div>
              <p className="font-semibold text-aiden-text-primary">
                {isUrdu ? "حرکت میں کمی (Reduced Motion)" : "Reduced Motion Compatibility"}
              </p>
              <p className="text-xs text-aiden-text-muted">
                {isUrdu
                  ? "سسٹم کی ترجیح کے مطابق اینیمیشنز خود بخود غیر فعال ہو جاتی ہیں"
                  : "All transitions respect OS prefers-reduced-motion settings"}
              </p>
            </div>
            <Badge variant="success" size="sm">
              Active
            </Badge>
          </div>

          <div className="p-3 rounded-aiden-md bg-aiden-surface-secondary border border-aiden-border-subtle flex items-center justify-between">
            <div>
              <p className="font-semibold text-aiden-text-primary">
                {isUrdu ? "کی بورڈ فوکس اشارے" : "WCAG 2.2 AA Visible Focus Rings"}
              </p>
              <p className="text-xs text-aiden-text-muted">
                3px high-contrast focus rings on all interactive buttons and inputs
              </p>
            </div>
            <Badge variant="success" size="sm">
              Active
            </Badge>
          </div>
        </div>
      </Card>

      {/* 5. System Diagnostics & AI Status */}
      <Card variant="standard" padding="lg">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm sm:text-base font-bold text-aiden-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-aiden-primary" />
            <span>{isUrdu ? "سسٹم کی تشخیصی کیفیت" : "Live System Diagnostics"}</span>
          </h2>
          <Badge variant="accent" size="sm">
            Live Health
          </Badge>
        </div>
        <p className="text-xs text-aiden-text-muted mb-4 pb-2 border-b border-aiden-border-subtle">
          {isUrdu
            ? "تمام ماڈلز اور مواصلاتی چینلز کا حقیقی وقت کا امتحان:"
            : "Real-time verification of local neural weights, device sensors, and API connectivity:"}
        </p>

        <div className="divide-y divide-aiden-border-subtle">
          <StatusRow
            label={isUrdu ? "بیک اینڈ سرور" : "Backend API Server"}
            value={status.backend}
          />
          <StatusRow
            label={isUrdu ? "اشاروں کی شناخت (PSL ONNX)" : "PSL Sign Classifier (ONNX)"}
            value={status.signRecognition}
          />
          <StatusRow
            label={isUrdu ? "کرنسی کی شناخت (PKR ONNX)" : "Currency Classifier (ONNX)"}
            value={status.currencyRecognition}
          />
          <StatusRow
            label={isUrdu ? "بولنا (TTS)" : "Text-to-Speech Engine (TTS)"}
            value={status.tts}
          />
          <StatusRow
            label={isUrdu ? "اردو آواز کا معیار" : "Urdu Voice Quality"}
            value={status.tts === "checking" ? "checking" : hasUrduVoice ? "ok" : "down"}
          />
          <StatusRow
            label={isUrdu ? "آواز سے متن (STT)" : "Speech-to-Text Recognition (STT)"}
            value={status.stt}
          />
          <StatusRow
            label={isUrdu ? "کیمرہ/مائیکروفون ہارڈویئر" : "Camera & Microphone Media"}
            value={status.camera}
          />
        </div>
      </Card>
    </div>
  );
}
