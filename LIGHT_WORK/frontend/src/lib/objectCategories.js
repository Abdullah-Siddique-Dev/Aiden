// Maps the 80 raw COCO-SSD class names to broad categories, so Live Guide
// speaks "there's a vehicle ahead" instead of "there's a bus ahead" by
// default — easier to parse quickly for a low-vision user, per the original
// spec. The exact class name is still available as secondary text.
const CATEGORY_MAP = {
  person: "person",
  bicycle: "vehicle", car: "vehicle", motorcycle: "vehicle", bus: "vehicle", train: "vehicle", truck: "vehicle", boat: "vehicle", airplane: "vehicle",
  bird: "animal", cat: "animal", dog: "animal", horse: "animal", sheep: "animal", cow: "animal", elephant: "animal", bear: "animal", zebra: "animal", giraffe: "animal",
  chair: "furniture", couch: "furniture", bed: "furniture", "dining table": "furniture", "potted plant": "furniture", toilet: "furniture",
  "traffic light": "signal", "stop sign": "signal", "fire hydrant": "signal", "parking meter": "signal", bench: "obstacle",
  backpack: "item", umbrella: "item", handbag: "item", tie: "item", suitcase: "item", frisbee: "item", skis: "item", snowboard: "item",
  "sports ball": "item", kite: "item", "baseball bat": "item", "baseball glove": "item", skateboard: "item", surfboard: "item", "tennis racket": "item",
  bottle: "item", "wine glass": "item", cup: "item", fork: "item", knife: "item", spoon: "item", bowl: "item",
  banana: "food", apple: "food", sandwich: "food", orange: "food", broccoli: "food", carrot: "food", "hot dog": "food", pizza: "food", donut: "food", cake: "food",
  tv: "item", laptop: "item", mouse: "item", remote: "item", keyboard: "item", "cell phone": "item",
  microwave: "item", oven: "item", toaster: "item", sink: "item", refrigerator: "item",
  book: "item", clock: "item", vase: "item", scissors: "item", "teddy bear": "item", "hair drier": "item", toothbrush: "item", door: "obstacle",
};

const CATEGORY_LABEL = {
  en: {
    person: "a person", vehicle: "a vehicle", animal: "an animal", furniture: "furniture",
    signal: "a signal", obstacle: "an obstacle", item: "an item", food: "food",
  },
  ur: {
    person: "ایک شخص", vehicle: "گاڑی", animal: "ایک جانور", furniture: "فرنیچر",
    signal: "سگنل", obstacle: "رکاوٹ", item: "ایک چیز", food: "کھانا",
  },
};

export function categoryFor(cocoClass) {
  return CATEGORY_MAP[cocoClass] || "item";
}

export function categoryLabel(cocoClass, language) {
  const cat = categoryFor(cocoClass);
  return CATEGORY_LABEL[language === "ur" ? "ur" : "en"][cat] || cat;
}

// Simple obstacle-closeness heuristic: no new model needed, just how much
// of the frame the bounding box covers.
export function isClose(prediction, frameW, frameH) {
  const [, , w, h] = prediction.bbox;
  const frac = (w * h) / (frameW * frameH);
  return frac > 0.35; // box covers over a third of the frame -> flag as close
}
