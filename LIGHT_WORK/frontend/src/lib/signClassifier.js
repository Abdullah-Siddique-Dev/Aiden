// Lightweight, fully-client-side PSL sign classifier.
//
// There is no public trained PSL model/dataset to import, so instead of faking
// recognition we compute real geometric features from MediaPipe hand landmarks
// (finger curl per finger, thumb-index pinch distance, hand height relative to
// the body, and short-term wrist motion) and match them against hand-authored
// templates for the 20 supported signs. This is a genuine nearest-template
// classifier — accuracy is "helpful demo" grade, not production grade, and it
// should be swapped for a properly trained model (e.g. fine-tuned on real PSL
// video data) before clinical/production use. We surface this honestly in the UI.

const FINGERS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Returns 0 (fully curled/closed) .. 1 (fully extended) per finger.
function curlAmount(landmarks, name) {
  const [mcp, pip, , tip] = FINGERS[name].map((i) => landmarks[i]);
  const wrist = landmarks[0];
  const spanOpen = dist(wrist, tip);
  const spanRef = dist(wrist, mcp) * 2.2; // rough normalizer
  return Math.max(0, Math.min(1, spanOpen / spanRef));
}

export function extractFeatures(landmarks) {
  const curls = Object.keys(FINGERS).reduce((acc, f) => {
    acc[f] = curlAmount(landmarks, f);
    return acc;
  }, {});
  const pinch = dist(landmarks[4], landmarks[8]);
  const wrist = landmarks[0];
  return { curls, pinch, wrist };
}

// Templates: expected curl (0=closed,1=open) per finger, and pinch (closed<0.08).
// "region" and "motion" are advisory hints checked loosely by the caller.
const TEMPLATES = {
  hello: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "face", motion: "wave" },
  bye: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "neutral", motion: "wave" },
  yes: { curls: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }, region: "neutral", motion: "tap" },
  no: { curls: { thumb: 0.5, index: 0.4, middle: 1, ring: 1, pinky: 1 }, region: "neutral", motion: "tap" },
  ok: { curls: { thumb: 0.3, index: 0.3, middle: 1, ring: 1, pinky: 1 }, pinchClosed: true, region: "neutral", motion: "static" },
  stop: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "chest", motion: "chop" },
  good: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "chin", motion: "swipe" },
  thank_you: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "chin", motion: "forward" },
  please: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "chest", motion: "circle" },
  sorry: { curls: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }, region: "chest", motion: "circle" },
  help: { curls: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }, region: "chest", motion: "lift" },
  water: { curls: { thumb: 1, index: 1, middle: 1, ring: 0, pinky: 0 }, region: "chin", motion: "tap" },
  food: { curls: { thumb: 0.3, index: 0.3, middle: 0.3, ring: 0.3, pinky: 0.3 }, region: "chin", motion: "tap" },
  home: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "cheek", motion: "static" },
  school: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "chest", motion: "clap" },
  mom: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "chin", motion: "tap" },
  dad: { curls: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }, region: "forehead", motion: "tap" },
  friend: { curls: { thumb: 0.5, index: 0, middle: 1, ring: 1, pinky: 1 }, region: "neutral", motion: "hook" },
  love: { curls: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }, region: "chest", motion: "hug" },
  name: { curls: { thumb: 0.5, index: 0, middle: 0, ring: 1, pinky: 1 }, region: "neutral", motion: "tap" },
};

function regionFor(wristY) {
  // wristY normalized 0 (top of frame) .. 1 (bottom of frame)
  if (wristY < 0.28) return "forehead";
  if (wristY < 0.4) return "face";
  if (wristY < 0.48) return "chin";
  if (wristY < 0.5) return "cheek";
  if (wristY < 0.68) return "chest";
  return "neutral";
}

export function classifySign(landmarks, motionHint = "static") {
  const feat = extractFeatures(landmarks);
  const region = regionFor(feat.wrist.y);
  let best = null;
  let bestScore = -Infinity;

  for (const [signId, tpl] of Object.entries(TEMPLATES)) {
    let score = 0;
    for (const f of Object.keys(FINGERS)) {
      score -= Math.abs(feat.curls[f] - tpl.curls[f]);
    }
    if (tpl.pinchClosed) score += feat.pinch < 0.08 ? 0.6 : -0.6;
    if (tpl.region === region) score += 0.5;
    if (tpl.motion === motionHint) score += 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = signId;
    }
  }

  // Normalize a rough confidence 0..1 for UI display.
  const confidence = Math.max(0, Math.min(1, (bestScore + 5) / 6));
  return { signId: best, confidence };
}
