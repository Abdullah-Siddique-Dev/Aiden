import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { useApp } from "../context/AppContext";
import { useCamera } from "../lib/useCamera";

// Continuous "point the camera at anything with text on it" reader — a book page, a
// sign, a product label, a screen, a wall — it keeps scanning, and whenever it finds
// text it rewrites it clearly on screen AND reads it aloud. This does not need a
// custom-trained model (Tesseract.js runs entirely in the browser); a dedicated model
// can be swapped in later if accuracy needs to improve, without changing this page's
// structure.
const SCAN_INTERVAL_MS = 2500;

export default function TextReader() {
  const { language, speak } = useApp();
  const { videoRef, active, error, start, stop } = useCamera(language);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const lastSpokenRef = useRef("");
  const loopRef = useRef(null);

  const scanningRef = useRef(false);

  useEffect(() => () => { stop(); clearTimeout(loopRef.current); }, [stop]);

  async function handleStart() {
    // Registers a real click for the browser's speech-permission requirement (same
    // reasoning as the other camera tabs) before any auto speak() call happens.
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
    setStatus(language === "ur" ? "پڑھا جا رہا ہے…" : "Reading…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const langs = language === "ur" ? "urd+eng" : "eng+urd";
      const { data } = await Tesseract.recognize(canvas, langs);
      const found = (data.text || "").replace(/\s+/g, " ").trim();

      if (found && found.length > 2) {
        setText(found);
        setStatus("");
        // Only re-speak if the text actually changed since last time — otherwise a
        // steady camera would repeat the same sentence every 2.5 seconds forever.
        if (found !== lastSpokenRef.current) {
          lastSpokenRef.current = found;
          speak(found.slice(0, 500));
        }
      } else {
        setStatus(language === "ur" ? "کوئی تحریر نظر نہیں آ رہی" : "No text visible right now");
      }
    } catch {
      setStatus(language === "ur" ? "پڑھنے میں مسئلہ ہوا" : "Trouble reading — try moving closer or improving light");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-2">
        {language === "ur" ? "تحریر پڑھنے والا" : "Text Reader"}
      </h1>
      <p className="text-sm text-ink/60 mb-4">
        {language === "ur"
          ? "کیمرہ کسی بھی چیز، صفحے، یا اسکرین پر موجود تحریر کے سامنے رکھیں — یہ خود بخود پڑھ کر بولے گا۔"
          : "Point the camera at anything with text on it — a page, a sign, a screen — it will keep reading automatically."}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</p>
      )}

      <div className="rounded-card overflow-hidden bg-black aspect-video mb-4 relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {busy && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {language === "ur" ? "پڑھ رہا ہے…" : "scanning…"}
          </span>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        {!active ? (
          <button onClick={handleStart} className="bg-teal text-white rounded-card px-4 py-2 font-medium">
            {language === "ur" ? "شروع کریں" : "Start"}
          </button>
        ) : (
          <button onClick={handleStop} className="bg-red-500 text-white rounded-card px-4 py-2 font-medium">
            {language === "ur" ? "روکیں" : "Stop"}
          </button>
        )}
        {text && (
          <button
            onClick={() => speak(text.slice(0, 500))}
            className="bg-teal-light text-teal-dark rounded-card px-4 py-2 font-medium"
          >
            🔊 {language === "ur" ? "دوبارہ سنیں" : "Replay"}
          </button>
        )}
      </div>

      {status && <p className="text-sm text-ink/50 mb-3">{status}</p>}

      {text && (
        <div className="bg-white border hairline rounded-card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-1">
            {language === "ur" ? "دوبارہ لکھی گئی تحریر" : "Rewritten text"}
          </p>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
      )}
    </div>
  );
}
