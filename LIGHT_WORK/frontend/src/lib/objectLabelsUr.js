// Urdu translations for the 80 COCO-SSD object classes, used so live narration
// and object detection speak naturally in Urdu rather than mixing in English nouns.
export const OBJECT_LABELS_UR = {
  person: "شخص", bicycle: "سائیکل", car: "گاڑی", motorcycle: "موٹر سائیکل", airplane: "ہوائی جہاز",
  bus: "بس", train: "ٹرین", truck: "ٹرک", boat: "کشتی", "traffic light": "ٹریفک لائٹ",
  "fire hydrant": "فائر ہائیڈرنٹ", "stop sign": "رکنے کا نشان", "parking meter": "پارکنگ میٹر", bench: "بینچ",
  bird: "پرندہ", cat: "بلی", dog: "کتا", horse: "گھوڑا", sheep: "بھیڑ", cow: "گائے", elephant: "ہاتھی",
  bear: "ریچھ", zebra: "زیبرا", giraffe: "زرافہ", backpack: "بیگ", umbrella: "چھتری", handbag: "ہینڈ بیگ",
  tie: "ٹائی", suitcase: "سوٹ کیس", frisbee: "فریسبی", skis: "سکی", snowboard: "سنو بورڈ",
  "sports ball": "گیند", kite: "پتنگ", "baseball bat": "بیس بال بلا", "baseball glove": "دستانہ",
  skateboard: "سکیٹ بورڈ", surfboard: "سرف بورڈ", "tennis racket": "ٹینس ریکٹ", bottle: "بوتل",
  "wine glass": "گلاس", cup: "کپ", fork: "کانٹا", knife: "چھری", spoon: "چمچ", bowl: "پیالہ",
  banana: "کیلا", apple: "سیب", sandwich: "سینڈوچ", orange: "مالٹا", broccoli: "بروکلی", carrot: "گاجر",
  "hot dog": "ہاٹ ڈاگ", pizza: "پیزا", donut: "ڈونٹ", cake: "کیک", chair: "کرسی", couch: "صوفہ",
  "potted plant": "گملا", bed: "بستر", "dining table": "میز", toilet: "باتھ روم", tv: "ٹی وی",
  laptop: "لیپ ٹاپ", mouse: "ماؤس", remote: "ریموٹ", keyboard: "کی بورڈ", "cell phone": "موبائل فون",
  microwave: "مائیکروویو", oven: "اوون", toaster: "ٹوسٹر", sink: "سنک", refrigerator: "فریج",
  book: "کتاب", clock: "گھڑی", vase: "گلدان", scissors: "قینچی", "teddy bear": "ٹیڈی بیئر",
  "hair drier": "ہیئر ڈرائر", toothbrush: "ٹوتھ برش", door: "دروازہ",
};

export function translateObjectLabel(label, language) {
  if (language !== "ur") return label;
  return OBJECT_LABELS_UR[label] || label;
}
