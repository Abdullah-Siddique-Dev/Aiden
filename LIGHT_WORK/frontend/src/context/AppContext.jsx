import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { t as translate } from "../i18n/i18n";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);
const SCALES = { small: 0.9, medium: 1, large: 1.15, xlarge: 1.35 };

export function AppProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const [language, setLanguageState] = useState(localStorage.getItem("aiden_lang") || "en");
  const [fontSize, setFontSizeState] = useState(localStorage.getItem("aiden_font") || "medium");
  const [highContrast, setHighContrastState] = useState(localStorage.getItem("aiden_contrast") === "1");

  useEffect(() => {
    if (user) {
      setLanguageState(user.language || "en");
      setFontSizeState(user.font_size || "medium");
      setHighContrastState(!!user.high_contrast);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", SCALES[fontSize] || 1);
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [fontSize, language]);

  const setLanguage = useCallback(
    (lang) => {
      setLanguageState(lang);
      localStorage.setItem("aiden_lang", lang);
      if (user) updateProfile({ language: lang }).catch(() => {});
    },
    [user, updateProfile]
  );

  const setFontSize = useCallback(
    (size) => {
      setFontSizeState(size);
      localStorage.setItem("aiden_font", size);
      if (user) updateProfile({ font_size: size }).catch(() => {});
    },
    [user, updateProfile]
  );

  const setHighContrast = useCallback(
    (val) => {
      setHighContrastState(val);
      localStorage.setItem("aiden_contrast", val ? "1" : "0");
      if (user) updateProfile({ high_contrast: val ? 1 : 0 }).catch(() => {});
    },
    [user, updateProfile]
  );

  const t = useCallback((key) => translate(language, key), [language]);

  // ---- Speech synthesis (TTS) ----
  // Browsers don't ship a bundled Urdu voice — whether Urdu speech sounds
  // right depends on whether the OS/browser has an ur-PK/ur-IN voice
  // installed (Windows: Settings > Time & Language > Speech > Add voices).
  // We do the best we can from JS: actively search available voices for an
  // Urdu match (voices often load asynchronously, so we listen for that),
  // and fall back to Hindi (closest phonetic match) before giving up and
  // using whatever default voice the browser has.
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const pickVoice = useCallback(
    (lang) => {
      if (lang !== "ur") return voices.find((v) => v.lang?.startsWith("en")) || null;
      return (
        voices.find((v) => v.lang?.toLowerCase().startsWith("ur")) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith("hi")) || // closest phonetic fallback
        null
      );
    },
    [voices]
  );

  const speak = useCallback(
    (text) => {
      if (!("speechSynthesis" in window) || !text) return;

      // Chrome/Edge/Safari block the FIRST speechSynthesis.speak() of a page session
      // unless it happens inside a real user click/tap. Learning's auto-narration (and
      // Vision/SignTalk's automatic detection loops) call speak() WITHOUT a click —
      // if that's the very first attempt, the browser silently drops it, and on some
      // browsers this leaves the whole session muted afterwards too (every later
      // speak() call, including ones from a real click, keeps failing silently).
      // Fix: never let an un-gestured call be the first one. Until a real click has
      // "unlocked" audio, queue the text and show a one-time visible prompt instead of
      // pretending it spoke.
      if (!voiceUnlockedRef.current) {
        pendingSpeechRef.current = text;
        setNeedsVoiceUnlock(true);
        return;
      }

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === "ur" ? "ur-PK" : "en-US";
      const voice = pickVoice(language);
      if (voice) utter.voice = voice;
      utter.rate = language === "ur" ? 0.85 : 0.98; // a little slower helps intelligibility on the fallback voice
      window.speechSynthesis.speak(utter);
      // Chrome/Edge on Windows has a long-standing bug where speechSynthesis
      // silently stalls (goes "paused" internally) when speak() is called
      // repeatedly outside a direct click — exactly what Learning's
      // auto-narration and the Vision/Sign Talk detection loops do. Nudging
      // it with resume() right after speak() is the standard workaround.
      window.speechSynthesis.resume();
    },
    [language, pickVoice]
  );

  // ---- One-time voice unlock (see comment in speak() above) ----
  const voiceUnlockedRef = useRef(false);
  const pendingSpeechRef = useRef(null);
  const [needsVoiceUnlock, setNeedsVoiceUnlock] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const unlock = () => {
      if (voiceUnlockedRef.current) return;
      voiceUnlockedRef.current = true;
      setNeedsVoiceUnlock(false);
      // Prime the engine with a real (near-silent) utterance — this is what
      // actually satisfies the browser's "voice was used from a user gesture" check,
      // an empty-string utterance does NOT count on some browsers.
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
      // Now flush whatever was waiting to be said
      if (pendingSpeechRef.current) {
        const text = pendingSpeechRef.current;
        pendingSpeechRef.current = null;
        setTimeout(() => speak(text), 150);
      }
    };
    document.addEventListener("click", unlock, { once: true, capture: true });
    document.addEventListener("touchstart", unlock, { once: true, capture: true });
    document.addEventListener("keydown", unlock, { once: true, capture: true });
    return () => {
      document.removeEventListener("click", unlock, { capture: true });
      document.removeEventListener("touchstart", unlock, { capture: true });
      document.removeEventListener("keydown", unlock, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extra keep-alive for pages that speak repeatedly in a loop (Vision's
  // narration, Sign Talk's detection) — without this, the same Chrome/Edge
  // bug can leave the synthesis engine stuck "paused" after the first
  // utterance and every one after it goes silent with no error thrown.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 3000);
    return () => clearInterval(keepAlive);
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        t,
        speak,
        hasUrduVoice: voices.some((v) => v.lang?.toLowerCase().startsWith("ur")),
        needsVoiceUnlock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
