// Static picture box lookup — replaces the animated avatar in Learning and Sign Talk.
// Every entry below points at a REAL illustration file in frontend/public/signs/
// (reused from the earlier trained-model asset set) — nothing here is fabricated.
// Anything left as null (there shouldn't be any left, but just in case a new
// curriculum item is added later without a matching picture) shows an honest
// "no picture yet" placeholder instead of a fake/generic image.

// Urdu huroof filenames are named by unicode codepoint: "#U0627.png" for ا, etc.
// IMPORTANT: the literal "#" must be percent-encoded (%23) in the src URL —
// a raw "#" is parsed as a URL fragment by the browser, not part of the
// path, so <img src="/signs/#U0627.png"> silently fails to load (it
// actually requests "/signs/" and drops everything after the "#"). This bit
// everyone: it's not a typo, it's how URLs work.
function urduFile(ch) {
  return `/signs/%23U${ch.codePointAt(0).toString(16).padStart(4, "0")}.png`;
}

const URDU_HUROOF = [
  "ا", "ب", "پ", "ت", "ٹ", "ث", "ج", "چ", "ح", "خ", "د", "ڈ", "ذ", "ر", "ڑ", "ز", "ژ",
  "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م", "ن", "و", "ہ", "ء", "ی", "ے",
];

export const SIGN_IMAGES = {
  // ---- Level 2: PSL common words ----
  hello: "/signs/Hello.png",
  yes: "/signs/Yes.png",
  no: "/signs/No.png",
  thank_you: "/signs/ThankYou.png",
  help: "/signs/Help.png",
  please: "/signs/Please.png",
  sorry: "/signs/Sorry.png",
  ok: "/signs/OK.png",
  water: "/signs/Water.png",
  food: "/signs/Food.png",
  home: "/signs/Home.png",
  school: "/signs/School.png",
  mom: "/signs/Mom.png",
  dad: "/signs/Dad.png",
  friend: "/signs/Friend.png",
  love: "/signs/Love.png",
  name: "/signs/Name.png",
  good: "/signs/Good.png",
  bye: "/signs/Bye.png",
  stop: "/signs/Stop.png",

  // ---- Level 1: Digits 0-9 ----
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, d) => [`digit_${d}`, `/signs/number_${d}.png`])
  ),

  // ---- Level 1: English A-Z ----
  ...Object.fromEntries(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => [`alpha_${l}`, `/signs/alpha_${l.toLowerCase()}.png`])
  ),

  // ---- Level 1: Urdu huroof-e-tahaji (urdu_0 .. urdu_36) ----
  ...Object.fromEntries(URDU_HUROOF.map((ch, i) => [`urdu_${i}`, urduFile(ch)])),

  // ---- Level 2: Counting by 10s ----
  ...Object.fromEntries(
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => [`count_${n}`, `/signs/count_${n}.png`])
  ),
};

export function signImageFor(id) {
  return SIGN_IMAGES[id] || null;
}
