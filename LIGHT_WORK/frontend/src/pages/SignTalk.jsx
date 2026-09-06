import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useApp } from "../context/AppContext";
import { useCamera } from "../lib/useCamera";
import { classifySign } from "../lib/signClassifier";
import { pushFrameAndClassify, resetSignBuffer, preloadSignModel } from "../lib/signClassifierOnnx";
import SignPictureBox from "../components/SignPictureBox";

const SIGN_NAMES = {
  hello: { en: "Hello", ur: "ہیلو" }, yes: { en: "Yes", ur: "ہاں" }, no: { en: "No", ur: "نہیں" },
  thank_you: { en: "Thank You", ur: "شکریہ" }, help: { en: "Help", ur: "مدد" }, please: { en: "Please", ur: "براہ مہربانی" },
  sorry: { en: "Sorry", ur: "معاف کیجیے" }, ok: { en: "OK", ur: "ٹھیک ہے" }, water: { en: "Water", ur: "پانی" },
  food: { en: "Food", ur: "کھانا" }, home: { en: "Home", ur: "گھر" }, school: { en: "School", ur: "سکول" },
  mom: { en: "Mom", ur: "امی" }, dad: { en: "Dad", ur: "ابو" }, friend: { en: "Friend", ur: "دوست" },
  love: { en: "Love", ur: "محبت" }, name: { en: "Name", ur: "نام" }, good: { en: "Good", ur: "اچھا" },
  bye: { en: "Bye", ur: "الوداع" }, stop: { en: "Stop", ur: "رکو" },
};

export default function SignTalk() {
  const { t, language, speak } = useApp();
  const { videoRef, active, error, start, stop } = useCamera(language);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const loopRef = useRef(null);
  const holdRef = useRef({ signId: null, since: 0 });
  const lastAnnouncedRef = useRef({ signId: null, at: 0 });

  const [ready, setReady] = useState(false);
  const [detected, setDetected] = useState(null);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    (async () => {
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
      // Warm up the trained ONNX model in the background so the first
      // real prediction (after ~1s of frames) doesn't stall on a cold load.
      preloadSignModel().catch(() => {
        // If it fails to load (offline, blocked CDN, etc.) we silently keep
        // using the geometric fallback below — never crash the page over it.
      });
      setReady(true);
    })();
    return () => { cancelAnimationFrame(loopRef.current); stop(); };
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
    ctx.fillStyle = "#E1A73E";
    landmarks.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
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
      // Feed the rolling 30-frame buffer for the trained model (both hands).
      // Only accept its prediction if it's one of the curriculum's 20 known
      // words — the trained model's underlying dataset has ~75 classes and
      // most (e.g. random dataset words) aren't part of this vocabulary, and
      // letting those through was corrupting the shared "hold" timer so the
      // reliable heuristic path below never got to speak (this was the bug).
      pushFrameAndClassify(hands)
        .then((trained) => {
          if (!trained || !SIGN_NAMES[trained.signId]) return; // buffer filling, or not a known word
          announce(trained.signId, trained.confidence);
        })
        .catch(() => {
          // Trained model unavailable this frame (e.g. still loading) —
          // the heuristic fallback below already covers the user.
        });

      const { signId, confidence: conf } = classifySign(hand);
      setConfidence(conf);
      announce(signId, conf);
    } else {
      setConfidence(0);
      resetSignBuffer();
    }
    loopRef.current = requestAnimationFrame(loop);
  }

  function announce(signId, conf) {
    const now = Date.now();
    if (signId === holdRef.current.signId) {
      const heldMs = now - holdRef.current.since;
      if (heldMs > 700 && conf > 0.55 && (signId !== lastAnnouncedRef.current.signId || now - lastAnnouncedRef.current.at > 4000)) {
        setDetected(signId);
        const name = SIGN_NAMES[signId]?.[language] || signId;
        const sentence = language === "ur" ? `یہ "${name}" کا اشارہ ہے` : `That's the sign for "${name}"`;
        speak(sentence);
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl font-semibold">{t("nav_sign")}</h1>
      </div>
      <p className="text-sm text-ink/60 mb-4">
        {language === "ur"
          ? "کیمرے کے سامنے کوئی PSL اشارہ کریں اور چند لمحے ساکت رکھیں۔ (یہ ابتدائی/بیٹا پہچان ہے، مکمل تربیت یافتہ ماڈل نہیں۔)"
          : "Show a PSL sign to the camera and hold it steady for a moment. (This is a beta geometric recognizer, not a fully trained model.)"}
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="relative bg-black rounded-card overflow-hidden aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            {!active && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm text-center px-4">
                {error || (!ready ? "Loading hand-tracking model…" : "Camera preview")}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {!active ? (
              <button
                disabled={!ready}
                onClick={() => {
                  if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
                  start("environment");
                }}
                className="bg-teal text-white rounded-card px-4 py-2.5 font-medium disabled:opacity-40"
              >
                {t("start_camera")}
              </button>
            ) : (
              <button onClick={stop} className="bg-rani text-white rounded-card px-4 py-2.5 font-medium">
                {t("stop_camera")}
              </button>
            )}
          </div>
          {confidence > 0 && (
            <div className="mt-3 h-2 bg-teal-light rounded-full overflow-hidden">
              <div className="h-full bg-teal" style={{ width: `${Math.round(confidence * 100)}%` }} />
            </div>
          )}
        </div>

        <div className="bg-white border hairline rounded-card p-6 flex flex-col items-center text-center">
          <SignPictureBox id={detected} label={detected ? SIGN_NAMES[detected]?.[language] : (language === "ur" ? "منتظر" : "waiting")} size={140} />
          {detected ? (
            <>
              <p className="text-xs uppercase tracking-wide text-ink/40 mt-3">{t("sign_detected")}</p>
              <p className={`text-2xl font-display font-semibold mt-1 ${language === "ur" ? "font-urdu" : ""}`}>
                {SIGN_NAMES[detected]?.[language]}
              </p>
            </>
          ) : (
            <p className="text-ink/50 mt-4 text-sm">{t("sign_recognize")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
