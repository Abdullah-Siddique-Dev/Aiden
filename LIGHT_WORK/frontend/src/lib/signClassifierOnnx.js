// Real trained PSL sign classifier, running fully client-side.
//
// This replaces the geometric-template guesser (signClassifier.js) with the
// actual model trained earlier on the Word-Level PSL dataset (RandomForest,
// scikit-learn -> ONNX). The forest was pruned from 200 -> 40 trees and
// re-serialized so the browser download is ~600KB gzip instead of 236MB —
// same technique, far less weight. It is lazy-loaded only when the user opens
// Sign Talk, same as the rest of the vision bundle.
//
// Model expects a (30 frames x 126 values) sequence flattened to 3780 floats:
// 126 = 2 hands x 21 landmarks x (x, y, z). If only one hand is visible, the
// second hand's 63 values are zero-filled (matches how the training notebook
// handled missing-hand frames).
import * as ort from "onnxruntime-web";

// Force single-threaded WASM (no SharedArrayBuffer / COOP-COEP headers
// required) so this runs on plain static hosting like Netlify without extra
// server config — trades a little inference speed for zero deployment fuss.
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

const SEQ_LEN = 30;
const LANDMARKS_PER_HAND = 21;
const COORDS = 3; // x, y, z
const FEATURES_PER_FRAME = LANDMARKS_PER_HAND * COORDS * 2; // 126, 2 hands

let session = null;
let classList = null;
let loadingPromise = null;
let frameBuffer = [];

async function ensureLoaded() {
  if (session && classList) return { session, classList };
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const [sess, classes] = await Promise.all([
        ort.InferenceSession.create("/models/sign/psl_classifier.onnx"),
        fetch("/models/sign/psl_classes.json").then((r) => r.json()),
      ]);
      session = sess;
      classList = classes;
      return { session, classList };
    })();
  }
  return loadingPromise;
}

// hands: array of MediaPipe hand results, each an array of 21 {x,y,z} points.
// Pass both hands when available (Hand Landmarker with numHands: 2).
function frameToVector(hands) {
  const vec = new Array(FEATURES_PER_FRAME).fill(0);
  (hands || []).slice(0, 2).forEach((landmarks, handIdx) => {
    landmarks.slice(0, LANDMARKS_PER_HAND).forEach((pt, i) => {
      const base = handIdx * LANDMARKS_PER_HAND * COORDS + i * COORDS;
      vec[base] = pt.x;
      vec[base + 1] = pt.y;
      vec[base + 2] = pt.z || 0;
    });
  });
  return vec;
}

// Call once per camera frame with the current hand landmarks. Returns null
// until 30 frames have been buffered (~1 second at 30fps), then returns a
// prediction on a rolling window so it stays responsive.
export async function pushFrameAndClassify(hands) {
  frameBuffer.push(frameToVector(hands));
  if (frameBuffer.length > SEQ_LEN) frameBuffer.shift();
  if (frameBuffer.length < SEQ_LEN) return null;

  const { session: sess, classList: classes } = await ensureLoaded();
  const flat = new Float32Array(SEQ_LEN * FEATURES_PER_FRAME);
  frameBuffer.forEach((frame, i) => flat.set(frame, i * FEATURES_PER_FRAME));

  const input = new ort.Tensor("float32", flat, [1, SEQ_LEN * FEATURES_PER_FRAME]);
  const results = await sess.run({ input });
  const outputName = sess.outputNames[0]; // label
  const probsName = sess.outputNames[1]; // probabilities, if exported with zipmap:false

  const labelTensor = results[outputName];
  const predictedIndexOrLabel = labelTensor.data[0];

  let confidence = 1;
  if (probsName && results[probsName]) {
    const probs = Array.from(results[probsName].data);
    confidence = Math.max(...probs);
  }

  // ONNX RandomForestClassifier from skl2onnx returns the original string
  // label directly (not an index), since classes were strings.
  const signId = typeof predictedIndexOrLabel === "string" ? predictedIndexOrLabel : classes[predictedIndexOrLabel];

  return { signId, confidence, source: "trained-model" };
}

export function resetSignBuffer() {
  frameBuffer = [];
}

export async function preloadSignModel() {
  await ensureLoaded();
}
