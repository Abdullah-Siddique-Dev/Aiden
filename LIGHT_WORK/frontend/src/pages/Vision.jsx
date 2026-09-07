import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import Tesseract from "tesseract.js";
import { useApp } from "../context/AppContext";
import { useCamera } from "../lib/useCamera";
import { translateObjectLabel } from "../lib/objectLabelsUr";
import { categoryLabel, isClose } from "../lib/objectCategories";
import {
  loadCurrencyModel,
  addCurrencyExample,
  predictCurrency,
  getExampleCounts,
  PKR_DENOMINATIONS,
} from "../lib/currencyKNN";
import { predictCurrencyTrained } from "../lib/currencyOnnx";
import Avatar from "../components/Avatar";
import { Button, Card, Badge, Tabs, ProgressBar } from "../components/ui";
import {
  Camera,
  Volume2,
  Box,
  FileText,
  Banknote,
  Play,
  Square,
  Search,
  Star,
  X,
  Check,
  Sparkles,
} from "lucide-react";

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
  const [isStarting, setIsStarting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Object Learning state (Detect -> Select -> Remember -> Saved)
  const [rememberingObject, setRememberingObject] = useState(null);
  const [customObjectName, setCustomObjectName] = useState("");
  const [rememberedObjects, setRememberedObjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aiden_remembered_objects") || "{}");
    } catch {
      return {};
    }
  });
  const [justSaved, setJustSaved] = useState(false);

  const cocoModelRef = useRef(null);
  const loopRef = useRef(null);
  const lastSpokenRef = useRef({ text: "", at: 0 });
  const speakTimeoutRef = useRef(null);

  const isUrdu = language === "ur";

  function speakWithVisual(sentence) {
    if (!sentence) return;
    setIsSpeaking(true);
    speak(sentence);
    clearTimeout(speakTimeoutRef.current);
    const words = sentence.split(/\s+/).length;
    const duration = Math.max(1800, Math.min(6500, words * 150 + 800));
    speakTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false);
    }, duration);
  }

  useEffect(() => {
    return () => {
      stop();
      cancelAnimationFrame(loopRef.current);
      clearTimeout(speakTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureCoco() {
    if (!cocoModelRef.current) {
      setStatus(isUrdu ? "ماڈل لوڈ ہو رہا ہے…" : "Loading object detection model…");
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
      ctx.strokeStyle = "#E8B44F";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      const customName = rememberedObjects[p.class];
      const translated = translateObjectLabel(p.class, language);
      const labelText = customName
        ? `[Saved] ${customName} (${Math.round(p.score * 100)}%)`
        : `${translated} ${Math.round(p.score * 100)}%`;

      ctx.font = "14px Inter, sans-serif";
      const textW = ctx.measureText(labelText).width;
      ctx.fillStyle = "#2F6F5E";
      ctx.fillRect(x, Math.max(0, y - 24), textW + 12, 24);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, x + 6, Math.max(16, y - 7));
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
          centerX < frameW * 0.33
            ? isUrdu
              ? "بائیں طرف"
              : "on the left"
            : centerX > frameW * 0.66
            ? isUrdu
              ? "دائیں طرف"
              : "on the right"
            : isUrdu
            ? "سامنے"
            : "ahead";

        const customName = rememberedObjects[top.class];
        const catLabel = customName || categoryLabel(top.class, language);
        const close = isClose(top, frameW, frameH);
        const closeNote = close ? (isUrdu ? "، بہت قریب" : ", very close") : "";
        const sentence = isUrdu
          ? `${position} ${catLabel} ہے${closeNote}`
          : `There is ${catLabel} ${position}${closeNote}`;

        const now = Date.now();
        if (sentence !== lastSpokenRef.current.text || now - lastSpokenRef.current.at > 6000) {
          speakWithVisual(sentence);
          lastSpokenRef.current = { text: sentence, at: now };
        }
      }
      loopRef.current = requestAnimationFrame(() => setTimeout(tick, 900));
    };
    tick();
  }

  async function runOcr() {
    setOcrBusy(true);
    setStatus(isUrdu ? "تحریر پڑھی جا رہی ہے…" : "Reading text in view…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const langs = isUrdu ? "urd+eng" : "eng+urd";
      const { data } = await Tesseract.recognize(canvas, langs);
      const text = (data.text || "").trim();
      setStatus(text || (isUrdu ? "کوئی تحریر نہیں ملی" : "No text found"));
      if (text) speakWithVisual(text.slice(0, 400));
    } catch {
      setStatus(isUrdu ? "تحریر پڑھنے میں مسئلہ ہوا" : "Trouble reading text");
    } finally {
      setOcrBusy(false);
    }
  }

  async function trainCurrency(denomination) {
    await addCurrencyExample(videoRef.current, denomination);
    setExampleCounts(getExampleCounts());
    setStatus(
      isUrdu
        ? `${denomination} روپے کی مثال محفوظ کر لی`
        : `Saved an example of ${denomination} PKR note`
    );
  }

  async function identifyCurrency() {
    try {
      const trained = await predictCurrencyTrained(videoRef.current);
      if (trained && trained.confidence >= 0.55) {
        const denom = trained.denomination.replace(/_(front|back)$/, "");
        setCurrencyLabel(denom);
        const sentence = isUrdu ? `یہ ${denom} روپے کا نوٹ ہے` : `This is a ${denom} rupee note`;
        setStatus(sentence);
        speakWithVisual(sentence);
        return;
      }
    } catch {
      // Trained model fallback to live KNN
    }

    await loadCurrencyModel();
    const result = await predictCurrency(videoRef.current);
    if (!result) {
      setStatus(
        isUrdu
          ? "پہلے ہر نوٹ کی ایک مثال محفوظ کریں"
          : "Not confident — train each note by tapping its amount below while showing it to the camera"
      );
      return;
    }
    setCurrencyLabel(result.label);
    const sentence = isUrdu
      ? `یہ ${result.label} روپے کا نوٹ ہے`
      : `This is a ${result.label} rupee note`;
    setStatus(sentence);
    speakWithVisual(sentence);
  }

  async function runAnalyze() {
    setAnalyzing(true);
    setAnalyzeResult(null);
    const parts = [];
    const spokenParts = [];

    try {
      const model = await ensureCoco();
      const preds = await model.detect(videoRef.current);
      drawBoxes(preds);
      setDetections(preds);
      if (preds.length) {
        const top = preds.sort((a, b) => b.score - a.score)[0];
        const frameW = videoRef.current.videoWidth || 640;
        const frameH = videoRef.current.videoHeight || 480;
        const customName = rememberedObjects[top.class];
        const cat = customName || categoryLabel(top.class, language);
        const close = isClose(top, frameW, frameH);
        const closeNote = close ? (isUrdu ? " (بہت قریب)" : " (close)") : "";
        const text = isUrdu ? `${cat} نظر آ رہا ہے${closeNote}` : `There's ${cat} ahead${closeNote}`;
        parts.push({ kind: "object", text, secondary: translateObjectLabel(top.class, language) });
        spokenParts.push(text);
      }

      try {
        const trained = await predictCurrencyTrained(videoRef.current);
        if (trained && trained.confidence >= 0.6) {
          const denom = trained.denomination.replace(/_(front|back)$/, "");
          const text = isUrdu
            ? `یہ ${denom} روپے کا نوٹ لگتا ہے`
            : `This looks like a ${denom} rupee note`;
          parts.push({ kind: "currency", text });
          spokenParts.push(text);
        }
      } catch {
        // trained model unavailable
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const langs = isUrdu ? "urd+eng" : "eng+urd";
      const { data } = await Tesseract.recognize(canvas, langs);
      const foundText = (data.text || "").trim();
      if (foundText) {
        const text = isUrdu
          ? `تحریر ملی: ${foundText.slice(0, 120)}`
          : `Text found: ${foundText.slice(0, 120)}`;
        parts.push({ kind: "text", text });
        spokenParts.push(text);
      }

      if (!parts.length) {
        const text = isUrdu ? "کچھ واضح نہیں ملا" : "Nothing confident detected in scene";
        parts.push({ kind: "none", text });
        spokenParts.push(text);
      }

      setAnalyzeResult(parts);
      speakWithVisual(spokenParts.join(". "));
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
    setIsStarting(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    }
    try {
      await start();
    } finally {
      setIsStarting(false);
    }
  }

  useEffect(() => {
    if (active && mode === "narrate") runNarrationLoop();
    return () => cancelAnimationFrame(loopRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Object Learning: Save custom label
  function handleSaveObject() {
    if (!rememberingObject || !customObjectName.trim()) return;
    const updated = { ...rememberedObjects, [rememberingObject.class]: customObjectName.trim() };
    setRememberedObjects(updated);
    try {
      localStorage.setItem("aiden_remembered_objects", JSON.stringify(updated));
    } catch {}
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      setRememberingObject(null);
      setCustomObjectName("");
    }, 1500);
  }

  // Determine HUD state
  let hudState = "Idle";
  let hudBadgeColor = "bg-black/60 text-white/90 border-white/15";

  if (error) {
    hudState = "Error";
    hudBadgeColor = "bg-aiden-danger/90 text-white border-aiden-danger";
  } else if (isStarting) {
    hudState = "Starting Camera";
    hudBadgeColor = "bg-aiden-warning/90 text-white border-aiden-warning";
  } else if (!active) {
    hudState = "Idle";
    hudBadgeColor = "bg-black/60 text-white/80 border-white/20";
  } else if (isSpeaking) {
    hudState = "Speaking";
    hudBadgeColor = "bg-aiden-accent text-aiden-text-primary border-aiden-accent font-bold";
  } else if (analyzing || ocrBusy) {
    hudState = "Processing";
    hudBadgeColor = "bg-aiden-primary text-white border-aiden-primary";
  } else if (detections.length > 0) {
    hudState = "Object Detected";
    hudBadgeColor = "bg-aiden-success text-white border-aiden-success";
  } else {
    hudState = "Scanning";
    hudBadgeColor = "bg-aiden-primary-hover/90 text-white border-aiden-primary";
  }

  const visionTabs = MODES.map((m) => ({
    id: m,
    label: t(`vision_${m === "objects" ? "objects" : m}`),
    icon:
      m === "narrate" ? (
        <Volume2 className="w-4 h-4" />
      ) : m === "objects" ? (
        <Box className="w-4 h-4" />
      ) : m === "ocr" ? (
        <FileText className="w-4 h-4" />
      ) : (
        <Banknote className="w-4 h-4" />
      ),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <Avatar
          size={56}
          expression={isSpeaking ? "speaking" : analyzing || ocrBusy ? "thinking" : "alert"}
          className="drop-shadow-sm select-none"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-2xl sm:text-3xl font-bold text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
              {t("nav_vision")}
            </h1>
            <Badge variant="primary" size="sm">
              Workstation
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-aiden-text-secondary mt-0.5">
            {isUrdu
              ? "مسلسل منظر سنیں، اشیاء پہچانیں، نوٹ چیک کریں اور تحریر سنیں"
              : "Continuous spatial narration, object detection, PKR currency, and text reader"}
          </p>
        </div>
      </div>

      {/* Professional Camera Viewport with HUD Brackets & Scanline */}
      <Card
        variant="camera"
        padding="none"
        className="aspect-video relative shadow-modal viewfinder-hud"
      >
        {/* Additional corner brackets */}
        <span className="viewfinder-hud-tr" aria-hidden="true" />
        <span className="viewfinder-hud-bl" aria-hidden="true" />

        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* Animated Scanline overlay when active */}
        {active && !isSpeaking && <div className="animate-aiden-scan" />}

        {/* Inactive Placeholder Screen */}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-6 text-center bg-black/85 z-20">
            <Camera className="w-12 h-12 text-white/50 mb-3" aria-hidden="true" />
            <p className="text-xs sm:text-sm max-w-sm font-medium">
              {error ||
                (isUrdu
                  ? "کیمرہ فیڈ غیر فعال ہے — شروع کرنے کے لیے نیچے بٹن دبائیں"
                  : "Camera sensor inactive — tap Start Camera below to begin AI vision")}
            </p>
          </div>
        )}

        {/* Top-Left Viewport State Badge */}
        <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm ${hudBadgeColor}`}
          >
            {isSpeaking ? (
              <span className="flex items-center gap-0.5 h-3">
                <span className="w-1 bg-current rounded-full aiden-wave-bar-1" />
                <span className="w-1 bg-current rounded-full aiden-wave-bar-2" />
                <span className="w-1 bg-current rounded-full aiden-wave-bar-3" />
                <span className="w-1 bg-current rounded-full aiden-wave-bar-4" />
              </span>
            ) : (
              <span
                className={`w-2 h-2 rounded-full ${
                  active ? "bg-aiden-danger animate-ping" : "bg-white/40"
                }`}
              />
            )}
            <span>{hudState}</span>
          </span>
        </div>

        {/* Bottom-Right Resolution / HUD Metadata */}
        {active && (
          <div className="absolute bottom-3.5 right-3.5 z-20 hidden sm:flex items-center gap-2 text-[10px] font-mono text-white/80 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10">
            <span>FPS: 30</span>
            <span>·</span>
            <span>COCO-SSD v2</span>
          </div>
        )}
      </Card>

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!active ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleStart}
            loading={isStarting}
            icon={<Play className="w-4 h-4" />}
            className="font-bold shadow-sm flex-1 sm:flex-initial"
          >
            {t("start_camera")}
          </Button>
        ) : (
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              stop();
              cancelAnimationFrame(loopRef.current);
            }}
            icon={<Square className="w-4 h-4" />}
            className="font-bold shadow-sm flex-1 sm:flex-initial"
          >
            {t("stop_camera")}
          </Button>
        )}

        <Button
          variant="ai"
          size="md"
          disabled={!active || analyzing}
          loading={analyzing}
          onClick={runAnalyze}
          icon={<Search className="w-4 h-4" />}
          className="flex-1 font-bold shadow-sm"
        >
          {analyzing
            ? isUrdu
              ? "تجزیہ ہو رہا ہے…"
              : "Analyzing scene…"
            : isUrdu
            ? "ایک ٹیپ میں تجزیہ کریں"
            : "Analyze Scene (One Tap)"}
        </Button>
      </div>

      {/* One-Tap Analyze Combined Results */}
      {analyzeResult && (
        <Card
          variant="ai"
          padding="md"
          className="border-aiden-accent/40 shadow-subtle animate-fade-in"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aiden-primary">
              {isUrdu ? "تجزیاتی رپورٹ" : "Scene Multimodal Analysis"}
            </span>
            <Badge variant="accent" size="sm">
              AIDEN Vision
            </Badge>
          </div>
          <div className="space-y-1.5 divide-y divide-aiden-border-subtle">
            {analyzeResult.map((p, i) => (
              <div
                key={i}
                className={`pt-1.5 first:pt-0 text-xs sm:text-sm text-aiden-text-primary ${
                  isUrdu ? "font-urdu text-base" : ""
                }`}
              >
                <span className="font-semibold">{p.text}</span>
                {p.secondary && (
                  <span className="text-aiden-text-muted text-xs"> ({p.secondary})</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mode Switcher Tabs */}
      <div>
        <Tabs
          tabs={visionTabs}
          activeTab={mode}
          onChange={handleModeChange}
          variant="pills"
          className="w-full justify-start"
        />
      </div>

      {/* Mode Dedicated Panel Card */}
      <Card variant="standard" padding="md" className="shadow-subtle">
        {mode === "narrate" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-aiden-primary" aria-hidden="true" />
              <h3 className="font-bold text-sm text-aiden-text-primary">
                {isUrdu ? "مسلسل منظر سننا" : "Continuous Spatial Narration"}
              </h3>
            </div>
            <p
              className={`text-xs sm:text-sm text-aiden-text-secondary leading-relaxed ${
                isUrdu ? "font-urdu text-base" : ""
              }`}
            >
              {isUrdu
                ? "کیمرہ آن رکھیں — AIDEN خود بخود بول کر بتائے گا کہ آپ کے سامنے کیا چیز ہے اور کس سمت میں ہے۔"
                : "Keep camera streaming. AIDEN continuously narrates obstacles, category labels, and whether objects are ahead, on the left, or on the right."}
            </p>
          </div>
        )}

        {mode === "objects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-aiden-text-primary">
                  {isUrdu ? "اشیاء کی شناخت" : "Object Detection & Learning"}
                </h3>
                <p className="text-xs text-aiden-text-muted">
                  {isUrdu ? "کیمرے کے سامنے اشیاء رکھیں" : "Detect or teach custom object names to memory"}
                </p>
              </div>
              <Button variant="secondary" size="sm" disabled={!active} onClick={detectOnce}>
                {t("vision_objects")}
              </Button>
            </div>

            {/* Remember Object Flow Dialog */}
            {rememberingObject && (
              <div className="p-3.5 rounded-aiden-md bg-aiden-accent-light/50 border border-aiden-accent/50 animate-fade-in space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-aiden-text-primary">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-aiden-accent fill-aiden-accent" />
                    <span>{isUrdu ? "اس چیز کا ذاتی نام محفوظ کریں:" : "Remember this object:"}</span>
                    <span className="text-aiden-primary underline ml-1">{rememberingObject.class}</span>
                  </span>
                  <button
                    onClick={() => setRememberingObject(null)}
                    aria-label="Close dialog"
                    className="text-aiden-text-muted hover:text-aiden-text-primary p-1 rounded hover:bg-black/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    value={customObjectName}
                    onChange={(e) => setCustomObjectName(e.target.value)}
                    placeholder={
                      isUrdu ? "مثلاً: میری پانی کی بوتل" : "e.g. My Water Bottle, Mom's Glasses"
                    }
                    className="flex-1 text-xs sm:text-sm px-3 py-1.5 rounded-aiden-sm border border-aiden-border bg-white outline-none focus:border-aiden-primary"
                  />
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleSaveObject}
                    disabled={!customObjectName.trim() || justSaved}
                    icon={justSaved ? <Check className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                  >
                    {justSaved ? "Saved!" : "Remember"}
                  </Button>
                </div>
              </div>
            )}

            {detections.length === 0 ? (
              <p className="text-xs text-aiden-text-muted italic py-2">
                {isUrdu
                  ? "کیمرہ اشیاء کے سامنے رکھیں اور بٹن دبائیں۔"
                  : "Point camera at objects and tap Detect Objects to analyze."}
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {detections.map((d, i) => {
                  const custom = rememberedObjects[d.class];
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-aiden-md bg-aiden-surface-secondary border border-aiden-border flex flex-col gap-1.5 animate-fade-in"
                    >
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-aiden-text-primary">
                            {translateObjectLabel(d.class, language)}
                          </span>
                          {custom && (
                            <Badge variant="accent" size="sm" className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current text-current" />
                              <span>{custom}</span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-aiden-primary">
                            {Math.round(d.score * 100)}%
                          </span>
                          {!custom && (
                            <button
                              onClick={() => {
                                setRememberingObject(d);
                                setCustomObjectName("");
                              }}
                              title="Remember this object"
                              className="text-[11px] px-2 py-0.5 rounded bg-aiden-surface border border-aiden-border text-aiden-text-secondary hover:text-aiden-primary hover:border-aiden-primary transition-colors inline-flex items-center gap-1"
                            >
                              <Star className="w-3 h-3 text-aiden-accent fill-aiden-accent" />
                              <span>Remember</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <ProgressBar value={d.score * 100} size="sm" variant="primary" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {mode === "ocr" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-aiden-text-primary">
                {isUrdu ? "تحریر پڑھیں (OCR)" : "Read Printed Text (OCR)"}
              </h3>
              <Button
                variant="secondary"
                size="sm"
                disabled={!active || ocrBusy}
                loading={ocrBusy}
                onClick={runOcr}
              >
                {t("vision_ocr")}
              </Button>
            </div>

            {status && (
              <div
                className={`p-3.5 rounded-aiden-md bg-aiden-surface-secondary border border-aiden-border text-xs sm:text-sm text-aiden-text-primary leading-relaxed ${
                  isUrdu ? "font-urdu text-base" : ""
                }`}
              >
                {status}
              </div>
            )}
          </div>
        )}

        {mode === "currency" && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-aiden-text-primary">
              {isUrdu ? "پاکستانی کرنسی کی پہچان" : "PKR Currency Note Identifier"}
            </h3>
            <p className="text-xs text-aiden-text-secondary leading-relaxed">
              {isUrdu
                ? "نوٹ کو کیمرے کے سامنے رکھیں اور نیچے رقم پر ٹیپ کریں تاکہ ماڈل سیکھ سکے، پھر 'پہچانیں' دبائیں۔"
                : "Hold a banknote up to the camera. Tap Identify Currency to recognize with onnx neural weights, or teach live few-shot examples:"}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {PKR_DENOMINATIONS.map((d) => (
                <Button
                  key={d}
                  variant="secondary"
                  size="sm"
                  disabled={!active}
                  onClick={() => trainCurrency(d)}
                  className="text-xs font-semibold"
                >
                  {d} PKR {exampleCounts[d] ? `(${exampleCounts[d]})` : ""}
                </Button>
              ))}
            </div>

            <Button
              variant="accent"
              size="md"
              disabled={!active}
              onClick={identifyCurrency}
              className="w-full font-bold shadow-sm mt-2"
            >
              {t("vision_currency")}
            </Button>

            {currencyLabel && (
              <div className="p-3.5 rounded-aiden-md bg-aiden-accent-light/60 border border-aiden-accent/40 text-sm font-bold text-aiden-text-primary text-center animate-fade-in">
                {status}
              </div>
            )}
          </div>
        )}

        {status && mode !== "ocr" && mode !== "currency" && (
          <p className="text-xs text-aiden-text-muted mt-3 pt-2 border-t border-aiden-border-subtle">
            {status}
          </p>
        )}
      </Card>
    </div>
  );
}
