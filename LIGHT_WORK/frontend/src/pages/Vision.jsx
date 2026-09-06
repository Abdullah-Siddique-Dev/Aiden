import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import Tesseract from "tesseract.js";
import { useApp } from "../context/AppContext";
import { useCamera } from "../lib/useCamera";
import { translateObjectLabel } from "../lib/objectLabelsUr";
import { categoryLabel, isClose } from "../lib/objectCategories";
import { loadCurrencyModel, addCurrencyExample, predictCurrency, getExampleCounts, PKR_DENOMINATIONS } from "../lib/currencyKNN";
import { predictCurrencyTrained } from "../lib/currencyOnnx";
import Avatar from "../components/Avatar";

const MODES = ["narrate", "objects", "ocr", "currency"];

export default function Vision() {
  const { t, language, speak } = useApp();
  const { videoRef, active, error, start, stop } = useCamera(language);
  const canvasRef = useRef(null);
  const [mode, setMode] = useState("narrate");
  const [status, setStatus] = useState("");
  const [detections, setDetections] = useState([]);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [currencyLabel, setCurrencyLabel] = useState(null);
  const [exampleCounts, setExampleCounts] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const cocoModelRef = useRef(null);
  const loopRef = useRef(null);
  const lastSpokenRef = useRef({ text: "", at: 0 });

  useEffect(() => {
    return () => { stop(); cancelAnimationFrame(loopRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureCoco() {
    if (!cocoModelRef.current) {
      setStatus("Loading object detection model…");
      await tf.ready();
      cocoModelRef.current = await cocoSsd.load({ base: "lite_mobilenet_v2" });
      setStatus("");
    }
    return cocoModelRef.current;
  }

  function drawBoxes(predictions) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    predictions.forEach((p) => {
      const [x, y, w, h] = p.bbox;
      ctx.strokeStyle = "#E1A73E";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      const label = `${translateObjectLabel(p.class, language)} ${Math.round(p.score * 100)}%`;
      ctx.font = "16px Inter, sans-serif";
      const textW = ctx.measureText(label).width;
      ctx.fillStyle = "#1F6F5C";
      ctx.fillRect(x, Math.max(0, y - 22), textW + 10, 22);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + 5, Math.max(14, y - 6));
    });
  }

  async function detectOnce() {
    const model = await ensureCoco();
    const preds = await model.detect(videoRef.current);
    setDetections(preds);
    drawBoxes(preds);
    return preds;
  }

  async function runNarrationLoop() {
    const model = await ensureCoco();
    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        loopRef.current = requestAnimationFrame(tick);
        return;
      }
      const preds = await model.detect(videoRef.current);
      drawBoxes(preds);
      setDetections(preds);

      if (preds.length) {
        const top = preds.sort((a, b) => b.score - a.score)[0];
        const centerX = top.bbox[0] + top.bbox[2] / 2;
        const frameW = videoRef.current.videoWidth || 640;
        const frameH = videoRef.current.videoHeight || 480;
        const position =
          centerX < frameW * 0.33 ? (language === "ur" ? "بائیں طرف" : "on the left")
          : centerX > frameW * 0.66 ? (language === "ur" ? "دائیں طرف" : "on the right")
          : (language === "ur" ? "سامنے" : "ahead");
        // Speak the CATEGORY by default (e.g. "vehicle"), not the exact
        // class name — easier for a low-vision user to parse quickly. The
        // exact name still shows as secondary text in the detected list below.
        const catLabel = categoryLabel(top.class, language);
        const close = isClose(top, frameW, frameH);
        const closeNote = close ? (language === "ur" ? "، بہت قریب" : ", very close") : "";
        const sentence =
          language === "ur" ? `${position} ${catLabel} ہے${closeNote}` : `There is ${catLabel} ${position}${closeNote}`;

        const now = Date.now();
        if (sentence !== lastSpokenRef.current.text || now - lastSpokenRef.current.at > 6000) {
          speak(sentence);
          lastSpokenRef.current = { text: sentence, at: now };
        }
      }
      loopRef.current = requestAnimationFrame(() => setTimeout(tick, 900));
    };
    tick();
  }

  async function runOcr() {
    setOcrBusy(true);
    setStatus(language === "ur" ? "تحریر پڑھی جا رہی ہے…" : "Reading text…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const langs = language === "ur" ? "urd+eng" : "eng+urd";
      const { data } = await Tesseract.recognize(canvas, langs);
      const text = (data.text || "").trim();
      setStatus(text || (language === "ur" ? "کوئی تحریر نہیں ملی" : "No text found"));
      if (text) speak(text.slice(0, 400));
    } catch {
      setStatus(language === "ur" ? "تحریر پڑھنے میں مسئلہ ہوا" : "Trouble reading text");
    } finally {
      setOcrBusy(false);
    }
  }

  async function trainCurrency(denomination) {
    await addCurrencyExample(videoRef.current, denomination);
    setExampleCounts(getExampleCounts());
    setStatus(
      language === "ur" ? `${denomination} روپے کی مثال محفوظ کر لی` : `Saved an example of ${denomination} PKR`
    );
  }

  async function identifyCurrency() {
    // Try the model trained on the real Kaggle PKR dataset first — it works
    // immediately, no per-note training needed. Only fall back to the live
    // few-shot KNN (which needs the user to tap each denomination once) if
    // the trained model isn't confident or fails to load (offline, etc).
    try {
      const trained = await predictCurrencyTrained(videoRef.current);
      if (trained && trained.confidence >= 0.55) {
        const denom = trained.denomination.replace(/_(front|back)$/, "");
        setCurrencyLabel(denom);
        const sentence =
          language === "ur" ? `یہ ${denom} روپے کا نوٹ ہے` : `This is a ${denom} rupee note`;
        setStatus(sentence);
        speak(sentence);
        return;
      }
    } catch {
      // Trained model failed to load/run — drop through to the live KNN below.
    }

    await loadCurrencyModel();
    const result = await predictCurrency(videoRef.current);
    if (!result) {
      setStatus(
        language === "ur"
          ? "پہلے ہر نوٹ کی ایک مثال محفوظ کریں"
          : "Not confident — train each note by tapping its amount below while showing it to the camera"
      );
      return;
    }
    setCurrencyLabel(result.label);
    const sentence =
      language === "ur" ? `یہ ${result.label} روپے کا نوٹ ہے` : `This is a ${result.label} rupee note`;
    setStatus(sentence);
    speak(sentence);
  }

  async function runAnalyze() {
    setAnalyzing(true);
    setAnalyzeResult(null);
    const parts = [];
    const spokenParts = [];

    try {
      // 1. Objects (with category + closeness)
      const model = await ensureCoco();
      const preds = await model.detect(videoRef.current);
      drawBoxes(preds);
      setDetections(preds);
      if (preds.length) {
        const top = preds.sort((a, b) => b.score - a.score)[0];
        const frameW = videoRef.current.videoWidth || 640;
        const frameH = videoRef.current.videoHeight || 480;
        const cat = categoryLabel(top.class, language);
        const close = isClose(top, frameW, frameH);
        const closeNote = close ? (language === "ur" ? " (بہت قریب)" : " (close)") : "";
        const text = language === "ur" ? `${cat} نظر آ رہا ہے${closeNote}` : `There's ${cat} ahead${closeNote}`;
        parts.push({ kind: "object", text, secondary: translateObjectLabel(top.class, language) });
        spokenParts.push(text);
      }

      // 2. Currency — only include if the trained model is confident, so a
      // random object doesn't get misreported as a banknote.
      try {
        const trained = await predictCurrencyTrained(videoRef.current);
        if (trained && trained.confidence >= 0.6) {
          const denom = trained.denomination.replace(/_(front|back)$/, "");
          const text = language === "ur" ? `یہ ${denom} روپے کا نوٹ لگتا ہے` : `This looks like a ${denom} rupee note`;
          parts.push({ kind: "currency", text });
          spokenParts.push(text);
        }
      } catch {
        // trained model unavailable — skip currency in this combined pass
      }

      // 3. OCR — quick pass, only report if text was actually found.
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const langs = language === "ur" ? "urd+eng" : "eng+urd";
      const { data } = await Tesseract.recognize(canvas, langs);
      const foundText = (data.text || "").trim();
      if (foundText) {
        const text = language === "ur" ? `تحریر ملی: ${foundText.slice(0, 120)}` : `Text found: ${foundText.slice(0, 120)}`;
        parts.push({ kind: "text", text });
        spokenParts.push(text);
      }

      if (!parts.length) {
        const text = language === "ur" ? "کچھ واضح نہیں ملا" : "Nothing confident detected";
        parts.push({ kind: "none", text });
        spokenParts.push(text);
      }

      setAnalyzeResult(parts);
      speak(spokenParts.join(". "));
    } finally {
      setAnalyzing(false);
    }
  }

  function handleModeChange(m) {
    cancelAnimationFrame(loopRef.current);
    setMode(m);
    setDetections([]);
    setStatus("");
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (m === "narrate" && active) runNarrationLoop();
  }

  async function handleStart() {
    // Registers this click as the "user gesture" the speech engine needs —
    // without a speak() call inside a direct click handler at least once,
    // some Chrome/Edge builds silently refuse every later speak() call from
    // the narration loop (no error, just no sound).
    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    }
    await start();
  }

  useEffect(() => {
    if (active && mode === "narrate") runNarrationLoop();
    return () => cancelAnimationFrame(loopRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Avatar size={56} expression={ocrBusy ? "thinking" : "alert"} />
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("nav_vision")}</h1>
          <p className="text-sm text-ink/50">
            {language === "ur" ? "کیمرہ اردو اور انگریزی دونوں میں بتاتا ہے" : "Works in both English and Urdu"}
          </p>
        </div>
      </div>

      <div className="relative bg-black rounded-card overflow-hidden aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            {error || "Camera preview"}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {!active ? (
          <button onClick={handleStart} className="bg-teal text-white rounded-card px-4 py-2.5 font-medium">
            {t("start_camera")}
          </button>
        ) : (
          <button onClick={() => { stop(); cancelAnimationFrame(loopRef.current); }} className="bg-rani text-white rounded-card px-4 py-2.5 font-medium">
            {t("stop_camera")}
          </button>
        )}
      </div>

      <div className="mt-4">
        <button
          disabled={!active || analyzing}
          onClick={runAnalyze}
          className="w-full bg-ink text-white rounded-card px-4 py-3 font-semibold disabled:opacity-40"
        >
          {analyzing
            ? (language === "ur" ? "تجزیہ ہو رہا ہے…" : "Analyzing…")
            : (language === "ur" ? "🔍 ایک ٹیپ میں تجزیہ کریں" : "🔍 Analyze (one tap)")}
        </button>
        {analyzeResult && (
          <div className="mt-3 bg-white border hairline rounded-card p-4 space-y-1.5">
            {analyzeResult.map((p, i) => (
              <p key={i} className={`text-sm ${language === "ur" ? "font-urdu" : ""}`}>
                {p.text}
                {p.secondary && <span className="text-ink/40"> ({p.secondary})</span>}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`rounded-card px-4 py-2 border hairline text-sm font-medium ${mode === m ? "bg-teal text-white" : "bg-white"}`}
          >
            {t(`vision_${m === "objects" ? "objects" : m}`)}
          </button>
        ))}
      </div>

      <div className="mt-5 bg-white border hairline rounded-card p-4">
        {mode === "narrate" && (
          <p className="text-ink/70 text-sm">
            {language === "ur" ? "کیمرہ آن کریں — AIDEN مسلسل بتائے گا کہ سامنے کیا ہے۔" : "Turn on the camera — AIDEN will keep narrating what's in front of you."}
          </p>
        )}
        {mode === "objects" && (
          <div>
            <button disabled={!active} onClick={detectOnce} className="bg-marigold text-ink rounded-card px-4 py-2 font-medium disabled:opacity-40 mb-3">
              {t("vision_objects")}
            </button>
            <ul className="text-sm space-y-1">
              {detections.map((d, i) => (
                <li key={i}>{translateObjectLabel(d.class, language)} — {Math.round(d.score * 100)}%</li>
              ))}
            </ul>
          </div>
        )}
        {mode === "ocr" && (
          <div>
            <button disabled={!active || ocrBusy} onClick={runOcr} className="bg-marigold text-ink rounded-card px-4 py-2 font-medium disabled:opacity-40 mb-3">
              {t("vision_ocr")}
            </button>
            {status && <p className={`text-sm ${language === "ur" ? "font-urdu text-lg" : ""}`}>{status}</p>}
          </div>
        )}
        {mode === "currency" && (
          <div>
            <p className="text-sm text-ink/60 mb-3">
              {language === "ur"
                ? "ہر نوٹ کیمرے کے سامنے رکھیں اور اس کی رقم پر ٹیپ کریں تاکہ AIDEN سیکھ لے، پھر 'پہچانیں' دبائیں۔"
                : "Hold each note to the camera and tap its amount to teach AIDEN, then tap Identify."}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PKR_DENOMINATIONS.map((d) => (
                <button key={d} disabled={!active} onClick={() => trainCurrency(d)}
                  className="border hairline rounded-card px-3 py-1.5 text-sm bg-teal-light disabled:opacity-40">
                  {d} {exampleCounts[d] ? `(${exampleCounts[d]})` : ""}
                </button>
              ))}
            </div>
            <button disabled={!active} onClick={identifyCurrency} className="bg-marigold text-ink rounded-card px-4 py-2 font-medium disabled:opacity-40">
              {t("vision_currency")}
            </button>
            {currencyLabel && <p className="mt-3 font-medium">{status}</p>}
          </div>
        )}
        {status && mode !== "ocr" && mode !== "currency" && <p className="text-sm text-ink/60 mt-2">{status}</p>}
      </div>
    </div>
  );
}
