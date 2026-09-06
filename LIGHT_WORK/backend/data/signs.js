// The 20 core PSL (Pakistan Sign Language) signs AIDEN supports.
// "cue" is a short plain-language description of the hand shape/motion,
// used both by the avatar teacher and as the geometric matching rule on the client.
export const PSL_SIGNS = [
  { id: "hello", en: "Hello", ur: "ہیلو", cue: "Open palm raised near forehead, wave gently side to side" },
  { id: "yes", en: "Yes", ur: "ہاں", cue: "Fist nods up and down like a small hammer" },
  { id: "no", en: "No", ur: "نہیں", cue: "Index and middle finger tap thumb twice, like a beak closing" },
  { id: "thank_you", en: "Thank You", ur: "شکریہ", cue: "Fingertips touch chin, hand moves forward and down" },
  { id: "help", en: "Help", ur: "مدد", cue: "Fist rests on flat opposite palm, both lift together" },
  { id: "please", en: "Please", ur: "براہ مہربانی", cue: "Flat palm circles gently on chest" },
  { id: "sorry", en: "Sorry", ur: "معاف کیجیے", cue: "Fist circles on chest over heart" },
  { id: "ok", en: "OK", ur: "ٹھیک ہے", cue: "Thumb and index finger form a circle, other fingers up" },
  { id: "water", en: "Water", ur: "پانی", cue: "'W' shaped fingers tap near chin twice" },
  { id: "food", en: "Food", ur: "کھانا", cue: "Fingertips bunched, tap toward mouth repeatedly" },
  { id: "home", en: "Home", ur: "گھر", cue: "Fingertips form a roof shape, hand touches cheek then jaw" },
  { id: "school", en: "School", ur: "سکول", cue: "Both palms clap twice, one on top of the other" },
  { id: "mom", en: "Mom", ur: "امی", cue: "Open hand, thumb taps chin" },
  { id: "dad", en: "Dad", ur: "ابو", cue: "Open hand, thumb taps forehead" },
  { id: "friend", en: "Friend", ur: "دوست", cue: "Index fingers hook together, then flip and hook again" },
  { id: "love", en: "Love", ur: "محبت", cue: "Both fists cross over chest, arms hug inward" },
  { id: "name", en: "Name", ur: "نام", cue: "Index and middle finger of both hands tap crosswise twice" },
  { id: "good", en: "Good", ur: "اچھا", cue: "Flat hand moves from chin outward and down into other palm" },
  { id: "bye", en: "Bye", ur: "الوداع", cue: "Open palm waves side to side away from body" },
  { id: "stop", en: "Stop", ur: "رکو", cue: "Edge of one flat hand chops down onto the other flat palm" },
];

// ---- Level 1: digits, English alphabet, Urdu huroof-e-tahaji ----
// Pulled from the trained ONNX classifiers' class lists
// (frontend/public/models/sign/*_classes.json) so the curriculum always
// matches what the classifier can actually recognize.
const DIGIT_LABELS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const DIGIT_ITEMS = DIGIT_LABELS.map((d) => ({
  id: `digit_${d}`,
  en: d,
  ur: d, // digits are the same glyphs; spoken Urdu number name isn't needed for a single-digit flashcard
  cue: "Show this number with your fingers, or trace its shape in the air.",
  kind: "digit",
}));

const ALPHA_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const ENGLISH_ITEMS = ALPHA_LABELS.map((l) => ({
  id: `alpha_${l}`,
  en: l,
  ur: l,
  cue: `The letter ${l}.`,
  kind: "english",
}));

// Urdu huroof-e-tahaji (+ a few common whole-word signs the same dataset
// included) — recovered from the trained model's label encoder.
const URDU_LABELS = [
  "ا", "ب", "پ", "ت", "ٹ", "ث", "ج", "چ", "ح", "خ", "د", "ڈ", "ذ", "ر", "ڑ", "ز", "ژ",
  "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م", "ن", "و", "ہ", "ء", "ی", "ے",
];
export const URDU_ITEMS = URDU_LABELS.map((h, i) => ({
  id: `urdu_${i}`,
  en: h, // Urdu script is the label itself in both fields — this is a huroof flashcard, not a translation
  ur: h,
  cue: "اردو کا یہ حرف بنائیں۔",
  kind: "urdu",
}));

// ---- Level 2 addition: counting by 10s (text/audio only — no trained
// sign model exists for numeral counting, so this is honestly text-only,
// same pattern the app already uses elsewhere for uncovered items). ----
export const MATH_COUNTING_ITEMS = Array.from({ length: 10 }, (_, i) => {
  const n = (i + 1) * 10;
  return { id: `count_${n}`, en: String(n), ur: String(n), cue: `Count to ${n} by tens.`, kind: "text" };
});

export const CURRICULUM = [
  // Level 1
  { id: "lesson_digits", level: 1, title_en: "Digits 0-9", title_ur: "ہندسے 0-9", signIds: DIGIT_ITEMS.map((d) => d.id) },
  { id: "lesson_alphabet", level: 1, title_en: "English Alphabet", title_ur: "انگریزی حروف", signIds: ENGLISH_ITEMS.map((d) => d.id) },
  { id: "lesson_huroof", level: 1, title_en: "Urdu Huroof", title_ur: "اردو حروفِ تہجی", signIds: URDU_ITEMS.map((d) => d.id) },
  // Level 2
  { id: "lesson_greetings", level: 2, title_en: "Greetings", title_ur: "سلام دعا", signIds: ["hello", "bye", "please", "thank_you", "sorry"] },
  { id: "lesson_basics", level: 2, title_en: "Everyday Basics", title_ur: "روزمرہ باتیں", signIds: ["yes", "no", "ok", "help", "stop"] },
  { id: "lesson_family", level: 2, title_en: "Family", title_ur: "خاندان", signIds: ["mom", "dad", "friend", "love", "name"] },
  { id: "lesson_needs", level: 2, title_en: "Needs & Places", title_ur: "ضروریات اور جگہیں", signIds: ["water", "food", "home", "school", "good"] },
  { id: "lesson_counting", level: 2, title_en: "Counting by 10s", title_ur: "دس دس گنیں", signIds: MATH_COUNTING_ITEMS.map((d) => d.id) },
];

// All flashcard items in one lookup, keyed by id — Learning.jsx uses this
// instead of PSL_SIGNS alone so Level 1 items resolve too.
export const ALL_ITEMS = [...PSL_SIGNS, ...DIGIT_ITEMS, ...ENGLISH_ITEMS, ...URDU_ITEMS, ...MATH_COUNTING_ITEMS];
