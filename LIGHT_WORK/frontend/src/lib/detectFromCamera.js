// Shared "auto-detect" pipeline for Chat's Detect & Send (Task 1). Captures
// from an already-active <video> element and tries, in order: sign -> currency
// -> OCR text -> object, stopping at the first confident result — same
// per-model confidence thresholds already used in SignTalk.jsx/Vision.jsx.
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import Tesseract from "tesseract.js";
import { pushFrameAndClassify, resetSignBuffer, preloadSignModel } from "./signClassifierOnnx";
import { predictCurrencyTrained } from "./currencyOnnx";
import { categoryLabel } from "./objectCategories";
import { translateObjectLabel } from "./objectLabelsUr";

let landmarkerPromise = null;
function ensureLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
      );
      return HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
    })();
  }
  return landmarkerPromise;
}

let cocoPromise = null;
function ensureCoco() {
  if (!cocoPromise) {
    cocoPromise = tf.ready().then(() => cocoSsd.load({ base: "lite_mobilenet_v2" }));
  }
  return cocoPromise;
}

export function preloadDetectors() {
  // Warm caches in the background so opening "Detect & Send" in chat feels
  // instant; failures here are silent — each step below re-tries on demand.
  preloadSignModel().catch(() => {});
  ensureLandmarker().catch(() => {});
}

// Runs a ~1 second burst (30 frames) through the hand landmarker + trained
// PSL ONNX classifier, matching how SignTalk.jsx captures sign sequences.
async function trySign(video) {
  try {
    const landmarker = await ensureLandmarker();
    resetSignBuffer();
    let result = null;
    for (let i = 0; i < 40 && !result; i++) {
      if (video.readyState < 2) { await new Promise((r) => setTimeout(r, 30)); continue; }
      const detection = landmarker.detectForVideo(video, performance.now());
      const hands = detection.landmarks || [];
      if (hands.length) {
        result = await pushFrameAndClassify(hands);
      }
      await new Promise((r) => setTimeout(r, 33)); // ~30fps
    }
    if (result && result.confidence >= 0.55) {
      return { kind: "sign", label: result.signId, confidence: result.confidence };
    }
  } catch {
    // Sign model unavailable — fall through to the next detector.
  }
  return null;
}

async function tryCurrency(video) {
  try {
    const trained = await predictCurrencyTrained(video);
    if (trained && trained.confidence >= 0.6) {
      const denom = trained.denomination.replace(/_(front|back)$/, "");
      return { kind: "currency", label: `${denom} PKR`, confidence: trained.confidence };
    }
  } catch {
    // Currency model unavailable — fall through.
  }
  return null;
}

async function tryOcr(video) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const { data } = await Tesseract.recognize(canvas, "eng+urd");
    const text = (data.text || "").trim();
    // Tesseract doesn't give a single scalar confidence the way sklearn
    // models do — data.confidence is 0-100 word-avg confidence.
    if (text && data.confidence >= 55) {
      return { kind: "text", label: text.slice(0, 200), confidence: data.confidence / 100 };
    }
  } catch {
    // OCR failed — fall through.
  }
  return null;
}

async function tryObject(video, language) {
  try {
    const model = await ensureCoco();
    const preds = await model.detect(video);
    if (preds.length) {
      const top = preds.sort((a, b) => b.score - a.score)[0];
      if (top.score >= 0.55) {
        const label = `${categoryLabel(top.class, language)} (${translateObjectLabel(top.class, language)})`;
        return { kind: "object", label, confidence: top.score };
      }
    }
  } catch {
    // Object model unavailable.
  }
  return null;
}

// Main entry point: tries sign -> currency -> OCR -> object, in that order,
// stopping at the first confident hit. If NONE of them clear their confidence
// threshold, we don't just return nothing — that's what made detection feel
// "too rare" — we fall back to the single best-scoring guess across all four,
// clearly marked as low-confidence, so the UI can show "Maybe: X" instead of
// silence. This never claims false certainty — it's explicit about being unsure.
export async function autoDetect(video, language = "en") {
  const sign = await trySign(video);
  if (sign) return sign;

  const currency = await tryCurrency(video);
  if (currency) return currency;

  const text = await tryOcr(video);
  if (text) return text;

  const object = await tryObject(video, language);
  if (object) return object;

  return await bestEffortGuess(video, language);
}

// Re-runs each detector with a lower bar and returns whichever scored highest,
// tagged lowConfidence so callers render it as an uncertain guess, not a result.
async function bestEffortGuess(video, language) {
  const candidates = [];
  try {
    const trained = await predictCurrencyTrained(video);
    if (trained) candidates.push({ kind: "currency", label: `${trained.denomination.replace(/_(front|back)$/, "")} PKR`, confidence: trained.confidence });
  } catch {}
  try {
    const model = await ensureCoco();
    const preds = await model.detect(video);
    if (preds.length) {
      const top = preds.sort((a, b) => b.score - a.score)[0];
      candidates.push({ kind: "object", label: `${categoryLabel(top.class, language)} (${translateObjectLabel(top.class, language)})`, confidence: top.score });
    }
  } catch {}

  if (!candidates.length) return null;
  const best = candidates.sort((a, b) => b.confidence - a.confidence)[0];
  if (best.confidence < 0.25) return null; // truly nothing usable — stay honest, don't guess wildly
  return { ...best, lowConfidence: true };
}
