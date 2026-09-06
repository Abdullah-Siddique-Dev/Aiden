import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const FONT_SIZES = ["small", "medium", "large", "xlarge"];
const ROLES = ["deaf", "mute", "visually_impaired", "student", "caregiver", "teacher", "none"];

// Live status checks — never hardcode a green checkmark. Each check either
// confirms the thing actually responds, or reports "unavailable"/"checking".
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

    return () => { cancelled = true; };
  }, []);

  return status;
}

function StatusRow({ label, value }) {
  const color = value === "ok" ? "bg-emerald-500" : value === "checking" ? "bg-amber-400" : "bg-red-500";
  const text = value === "ok" ? "Working" : value === "checking" ? "Checking…" : "Unavailable";
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-1.5 text-xs text-ink/60">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        {text}
      </span>
    </div>
  );
}

export default function Settings() {
  const { t, language, setLanguage, fontSize, setFontSize, highContrast, setHighContrast, hasUrduVoice } = useApp();
  const { user, updateProfile } = useAuth();
  const status = useAppStatus();

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">{t("settings_title")}</h1>

      <section className="bg-white border hairline rounded-card p-5 mb-4">
        <h2 className="font-medium mb-3">{t("name")}</h2>
        <input
          defaultValue={user.name}
          onBlur={(e) => updateProfile({ name: e.target.value })}
          className="w-full border hairline rounded-card px-3 py-2"
        />
        <h2 className="font-medium mt-4 mb-2">{t("i_am")}</h2>
        <select
          value={user.disability_type}
          onChange={(e) => updateProfile({ disability_type: e.target.value })}
          className="w-full border hairline rounded-card px-3 py-2 bg-white"
        >
          {ROLES.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}
        </select>
      </section>

      <section className="bg-white border hairline rounded-card p-5 mb-4">
        <h2 className="font-medium mb-3">{t("language")}</h2>
        <div className="flex gap-2">
          {["en", "ur"].map((l) => (
            <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-2 rounded-card border hairline ${language === l ? "bg-teal text-white" : "bg-white"}`}>
              {l === "en" ? "English" : "اردو"}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border hairline rounded-card p-5 mb-4">
        <h2 className="font-medium mb-3">{t("font_size")}</h2>
        <div className="flex gap-2">
          {FONT_SIZES.map((s) => (
            <button key={s} onClick={() => setFontSize(s)} className={`flex-1 py-2 rounded-card border hairline capitalize ${fontSize === s ? "bg-teal text-white" : "bg-white"}`}>
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border hairline rounded-card p-5 flex items-center justify-between">
        <span className="font-medium">{t("high_contrast")}</span>
        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`w-12 h-7 rounded-full relative transition-colors ${highContrast ? "bg-teal" : "bg-ink/20"}`}
          role="switch"
          aria-checked={highContrast}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${highContrast ? "left-6" : "left-1"}`} />
        </button>
      </section>

      <section className="bg-white border hairline rounded-card p-5 mt-4">
        <h2 className="font-medium mb-1">
          {language === "ur" ? "اس ایپ کے بارے میں" : "About This App"}
        </h2>
        <p className="text-sm text-ink/70 mb-3">
          {language === "ur"
            ? "AIDEN بہرے، گونگے، اور بصارت سے محروم افراد اور ان کے اہلِ خانہ/اساتذہ کے درمیان ایک مترجم اور رسائی ساتھی ہے۔"
            : "AIDEN is a translator and accessibility companion between deaf, mute, and visually impaired users and their family or teachers."}
        </p>
        <ul className="text-sm text-ink/70 list-disc pl-5 mb-4 space-y-0.5">
          <li>{language === "ur" ? "اشاروں کی شناخت (PSL)" : "Sign language recognition (PSL)"}</li>
          <li>{language === "ur" ? "کرنسی، متن، اور اشیاء کی شناخت" : "Currency, text, and object detection"}</li>
          <li>{language === "ur" ? "بولنے/سننے کی سہولت (TTS/STT)" : "Text-to-speech / speech-to-text"}</li>
          <li>{language === "ur" ? "آواز/ویڈیو کے ساتھ چیٹ" : "Chat with voice and video"}</li>
          <li>{language === "ur" ? "سیکھنے کا موڈ" : "Learning mode"}</li>
        </ul>
        <h3 className="text-xs font-medium uppercase tracking-wide text-ink/50 mb-1">
          {language === "ur" ? "موجودہ حیثیت" : "Live Status"}
        </h3>
        <div className="divide-y divide-ink/10">
          <StatusRow label={language === "ur" ? "بیک اینڈ سرور" : "Backend server"} value={status.backend} />
          <StatusRow label={language === "ur" ? "اشاروں کی شناخت" : "Sign recognition"} value={status.signRecognition} />
          <StatusRow label={language === "ur" ? "کرنسی کی شناخت" : "Currency recognition"} value={status.currencyRecognition} />
          <StatusRow label={language === "ur" ? "بولنا (TTS)" : "Text-to-speech"} value={status.tts} />
          <StatusRow
            label={language === "ur" ? "اردو آواز کا معیار" : "Urdu voice quality"}
            value={status.tts === "checking" ? "checking" : hasUrduVoice ? "ok" : "down"}
          />
          <StatusRow label={language === "ur" ? "آواز سے متن (STT)" : "Speech-to-text"} value={status.stt} />
          <StatusRow label={language === "ur" ? "کیمرہ/مائیک سپورٹ" : "Camera/mic support"} value={status.camera} />
        </div>
      </section>
    </div>
  );
}
