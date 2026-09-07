import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useApp } from "../context/AppContext";
import { useCamera } from "../lib/useCamera";
import { classifySign } from "../lib/signClassifier";
import { pushFrameAndClassify, resetSignBuffer, preloadSignModel } from "../lib/signClassifierOnnx";
import SignPictureBox from "../components/SignPictureBox";
import { Button, Card, Badge, ProgressBar } from "../components/ui";
import {
  Ear,
  Cpu,
  CheckCircle2,
  Volume2,
  Hand,
  History,
  Play,
  Square,
} from "lucide-react";

const SIGN_NAMES = {
  hello: { en: "Hello", ur: "ہیلو" },
  yes: { en: "Yes", ur: "ہاں" },
  no: { en: "No", ur: "نہیں" },
  thank_you: { en: "Thank You", ur: "شکریہ" },
  help: { en: "Help", ur: "مدد" },
  please: { en: "Please", ur: "براہ مہربانی" },
  sorry: { en: "Sorry", ur: "معاف کیجیے" },
  ok: { en: "OK", ur: "ٹھیک ہے" },
  water: { en: "Water", ur: "پانی" },
  food: { en: "Food", ur: "کھانا" },
  home: { en: "Home", ur: "گھر" },
  school: { en: "School", ur: "سکول" },
  mom: { en: "Mom", ur: "امی" },
  dad: { en: "Dad", ur: "ابو" },
  friend: { en: "Friend", ur: "دوست" },
  love: { en: "Love", ur: "محبت" },
  name: { en: "Name", ur: "نام" },
  good: { en: "Good", ur: "اچھا" },
  bye: { en: "Bye", ur: "الوداع" },
  stop: { en: "Stop", ur: "رکو" },
};

const FLOW_STEPS = ["listening", "analyzing", "recognized", "speaking"];

export default function SignTalk() {
  const { t, language, speak } = useApp();
  const { videoRef, active, error, start, stop } = useCamera(language);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const loopRef = useRef(null);
  const holdRef = useRef({ signId: null, since: 0 });
  const lastAnnouncedRef = useRef({ signId: null, at: 0 });
  const speakTimeoutRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [handInView, setHandInView] = useState(false);
  const [detected, setDetected] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [flowState, setFlowState] = useState("listening"); // "listening" | "analyzing" | "recognized" | "speaking"
  const [recentSigns, setRecentSigns] = useState([]);

  const isUrdu = language === "ur";

  useEffect(() => {
    (async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });
        preloadSignModel().catch(() => {});
        setReady(true);
      } catch {
        // MediaPipe load fallback
      }
    })();

    return () => {
      cancelAnimationFrame(loopRef.current);
      clearTimeout(speakTimeoutRef.current);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawLandmarks(landmarks) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    // Draw hand landmarks with glowing joints
    ctx.fillStyle = "#E8B44F";
    ctx.strokeStyle = "rgba(47, 111, 94, 0.7)";
    ctx.lineWidth = 2;

    landmarks.forEach((p) => {
      const cx = p.x * canvas.width;
      const cy = p.y * canvas.height;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      loopRef.current = requestAnimationFrame(loop);
      return;
    }

    const result = landmarker.detectForVideo(video, performance.now());
    const hands = result.landmarks || [];
    const hand = hands[0];
    drawLandmarks(hand);

    if (hand) {
      setHandInView(true);
      if (flowState === "listening") setFlowState("analyzing");

      pushFrameAndClassify(hands)
        .then((trained) => {
          if (!trained || !SIGN_NAMES[trained.signId]) return;
          announce(trained.signId, trained.confidence);
        })
        .catch(() => {});

      const { signId, confidence: conf } = classifySign(hand);
      setConfidence(conf);
      announce(signId, conf);
    } else {
      setHandInView(false);
      setConfidence(0);
      resetSignBuffer();
      if (flowState !== "speaking") setFlowState("listening");
    }

    loopRef.current = requestAnimationFrame(loop);
  }

  function announce(signId, conf) {
    const now = Date.now();
    if (signId === holdRef.current.signId) {
      const heldMs = now - holdRef.current.since;
      if (
        heldMs > 650 &&
        conf > 0.55 &&
        (signId !== lastAnnouncedRef.current.signId || now - lastAnnouncedRef.current.at > 3500)
      ) {
        setDetected(signId);
        setFlowState("recognized");

        // Append to recent signs history
        setRecentSigns((prev) => {
          const filtered = prev.filter((s) => s.id !== signId);
          return [{ id: signId, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...filtered].slice(0, 5);
        });

        const name = SIGN_NAMES[signId]?.[language] || signId;
        const sentence = isUrdu ? `یہ "${name}" کا اشارہ ہے` : `That's the sign for "${name}"`;

        clearTimeout(speakTimeoutRef.current);
        setFlowState("speaking");
        speak(sentence);

        speakTimeoutRef.current = setTimeout(() => {
          setFlowState("listening");
        }, 2200);

        lastAnnouncedRef.current = { signId, at: now };
      }
    } else {
      holdRef.current = { signId, since: now };
    }
  }

  useEffect(() => {
    if (active && ready) loop();
    return () => cancelAnimationFrame(loopRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ready]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-2xl sm:text-3xl font-bold text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
              {t("nav_sign")}
            </h1>
            <Badge variant="primary" size="sm">
              PSL Workstation
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-aiden-text-secondary mt-0.5 max-w-xl">
            {isUrdu
              ? "کیمرے کے سامنے PSL اشارہ دکھائیں اور ساکت رکھیں۔ AIDEN فوری طور پر پہچان کر ترجمہ بولے گا۔"
              : "Hold a Pakistan Sign Language (PSL) gesture steady in the camera frame. AIDEN translates live."}
          </p>
        </div>
      </div>

      {/* Recognition Flow Pipeline Indicators */}
      <div className="p-3.5 rounded-aiden-lg bg-aiden-surface border border-aiden-border shadow-subtle flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase text-aiden-text-muted shrink-0 mr-2">
          {isUrdu ? "حالت:" : "AI Flow:"}
        </span>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-around">
          {[
            { id: "listening", labelEn: "1. Listening", labelUr: "۱. منتظر", icon: Ear },
            { id: "analyzing", labelEn: "2. Analyzing", labelUr: "۲. جائزہ", icon: Cpu },
            { id: "recognized", labelEn: "3. Recognized", labelUr: "۳. شناخت شدہ", icon: CheckCircle2 },
            { id: "speaking", labelEn: "4. Speaking", labelUr: "۴. صوتی ترجمہ", icon: Volume2 },
          ].map((st) => {
            const isActive = flowState === st.id;
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

      {/* Two-Column Responsive Workstation */}
      <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
        {/* Left Column: Camera Viewport with HUD & Skeleton */}
        <div className="space-y-3">
          <Card
            variant="camera"
            padding="none"
            className="aspect-video relative shadow-modal viewfinder-hud"
          >
            {/* Corner brackets */}
            <span className="viewfinder-hud-tr" aria-hidden="true" />
            <span className="viewfinder-hud-bl" aria-hidden="true" />

            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

            {/* Inactive state */}
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-6 text-center bg-black/85 z-20">
                <Hand className="w-12 h-12 text-white/50 mb-3" aria-hidden="true" />
                <p className="text-xs sm:text-sm max-w-xs font-medium">
                  {error ||
                    (!ready
                      ? isUrdu
                        ? "نیورل ماڈل لوڈ ہو رہا ہے…"
                        : "Initializing MediaPipe hand tracker…"
                      : isUrdu
                      ? "کیمرہ بند ہے — شروع کرنے کے لیے بٹن دبائیں"
                      : "Camera inactive — tap Start Camera below")}
                </p>
              </div>
            )}

            {/* Top-Left Tracking Badge */}
            {active && (
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                    handInView
                      ? "bg-aiden-success/90 text-white border-aiden-success"
                      : "bg-black/60 text-white/90 border-white/20"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      handInView ? "bg-white animate-ping" : "bg-aiden-warning animate-pulse"
                    }`}
                  />
                  <span>{handInView ? "Hands Tracked (21 Joints)" : "Searching for Hands"}</span>
                </span>
              </div>
            )}

            {/* Speaking audio visualizer badge */}
            {flowState === "speaking" && (
              <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-aiden-accent text-aiden-text-primary backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-1 bg-current rounded-full aiden-wave-bar-1" />
                  <span className="w-1 bg-current rounded-full aiden-wave-bar-2" />
                  <span className="w-1 bg-current rounded-full aiden-wave-bar-3" />
                  <span className="w-1 bg-current rounded-full aiden-wave-bar-4" />
                </div>
                <span>Speaking</span>
              </div>
            )}
          </Card>

          {/* Action Control Button */}
          <div>
            {!active ? (
              <Button
                disabled={!ready}
                onClick={() => {
                  if ("speechSynthesis" in window) {
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
                  }
                  start("environment");
                }}
                variant="primary"
                size="md"
                className="w-full font-bold shadow-sm"
                icon={<Play className="w-4 h-4" />}
              >
                {t("start_camera")}
              </Button>
            ) : (
              <Button
                onClick={stop}
                variant="danger"
                size="md"
                className="w-full font-bold shadow-sm"
                icon={<Square className="w-4 h-4" />}
              >
                {t("stop_camera")}
              </Button>
            )}
          </div>

          {/* Real-time confidence meter */}
          {confidence > 0 && (
            <div className="p-3 rounded-aiden-md bg-aiden-surface border border-aiden-border shadow-subtle space-y-1">
              <ProgressBar
                value={confidence * 100}
                label={isUrdu ? "اعتماد کی شرح" : "PSL Classification Confidence"}
                showValue
                variant="primary"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Right Column: Recognized Sign Feedback & Action */}
        <div className="space-y-4">
          <Card
            variant="standard"
            padding="lg"
            className="flex flex-col items-center justify-center text-center shadow-card min-h-[340px] relative overflow-hidden"
          >
            <SignPictureBox
              id={detected}
              label={detected ? SIGN_NAMES[detected]?.[language] : isUrdu ? "منتظر" : "waiting"}
              size={170}
            />

            {detected ? (
              <div className="mt-4 space-y-2 w-full animate-fade-in">
                <Badge variant="accent" size="md" className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-aiden-success" />
                  <span>{t("sign_detected")}</span>
                </Badge>
                <h2
                  className={`text-3xl sm:text-4xl font-display font-bold text-aiden-text-primary tracking-tight ${
                    isUrdu ? "font-urdu text-5xl" : ""
                  }`}
                >
                  {SIGN_NAMES[detected]?.[language]}
                </h2>

                <div className="pt-2 flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const name = SIGN_NAMES[detected]?.[language] || detected;
                      const sentence = isUrdu ? `یہ "${name}" کا اشارہ ہے` : `That's the sign for "${name}"`;
                      speak(sentence);
                    }}
                    icon={<Volume2 className="w-4 h-4" />}
                    className="text-aiden-primary text-xs font-semibold"
                  >
                    {isUrdu ? "دوبارہ سنیں" : "Speak translation"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-aiden-text-primary">{t("sign_recognize")}</p>
                <p className="text-xs text-aiden-text-muted mt-1 max-w-xs leading-relaxed">
                  {isUrdu
                    ? "کوئی بھی اشارہ جیسے 'ہیلو'، 'شکریہ'، 'پانی'، 'مدد' کیمرے کے سامنے چند سیکنڈ ساکت رکھیں"
                    : "Show any standard sign like 'Hello', 'Thank You', 'Water', or 'Help' to the camera"}
                </p>
              </div>
            )}
          </Card>

          {/* Recent Signs History Strip */}
          <Card variant="subtle" padding="sm" className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-aiden-text-secondary px-1">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                <span>{isUrdu ? "حالیہ شناخت شدہ اشارے:" : "Session Sign History:"}</span>
              </span>
              <span className="font-mono text-[10px] text-aiden-text-muted">
                {recentSigns.length} {recentSigns.length === 1 ? "sign" : "signs"}
              </span>
            </div>

            {recentSigns.length === 0 ? (
              <p className="text-[11px] text-aiden-text-muted italic px-1">
                {isUrdu ? "ابھی تک کوئی اشارہ محفوظ نہیں ہوا" : "Recognized signs in this session will appear here"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {recentSigns.map((rs, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-aiden-border text-aiden-text-primary shadow-subtle animate-fade-in"
                  >
                    <Hand className="w-3.5 h-3.5 text-aiden-primary" />
                    <span>{SIGN_NAMES[rs.id]?.[language] || rs.id}</span>
                    <span className="text-[10px] text-aiden-text-muted font-normal">({rs.time})</span>
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
