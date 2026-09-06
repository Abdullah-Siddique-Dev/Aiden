"""
AIDEN Vision AI server — a small, always-running Python service the Node
backend / frontend calls for static-photo analysis (Take Photo / Upload
Photo, never continuous video — moving objects are hard to track reliably,
so this deliberately only ever analyzes one still frame at a time).

Everything here uses PRETRAINED or ALREADY-TRAINED models — nothing is
trained by this server:
  - Object detection: yolov8n.pt, pretrained on COCO (auto-downloads on
    first run, ~6MB).
  - Currency: the existing currency_model.pkl you already trained earlier
    (see currency.py — just loaded and reused, not retrained).
  - Text: EasyOCR's pretrained reader (auto-downloads its own weights).
  - Voice: gTTS (Google's cloud text-to-speech — needs internet, but gives
    a real Urdu voice, which solves the "Urdu voice quality" problem from
    the browser-only approach).

Run: uvicorn vision_ai.server:app --host 0.0.0.0 --port 8001
(from the backend/ folder, after `pip install -r vision_ai/requirements.txt`)
"""
import base64
import io
import os
import uuid

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from gtts import gTTS
from ultralytics import YOLO

from . import currency as currency_ai
from . import memory as object_memory

app = FastAPI(title="AIDEN Vision AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Loaded once at startup — this is *why* this runs as a long-lived server
# instead of a fresh process per request (which would reload these every
# single photo, taking 10-20s each time).
detector = YOLO("yolov8n.pt")
OBJECT_CONFIDENCE_THRESHOLD = 0.35

PHRASE_SOMETHING_AHEAD = "Kuch aagay nazar aa raha hai"
PHRASE_NOTHING_AHEAD = "Aagay kuch nahi hai, aap safely barh sakte hain"


def _read_upload(file_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(file_bytes, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _crop_to_base64(image_bgr: np.ndarray) -> str:
    ok, buf = cv2.imencode(".jpg", image_bgr)
    return base64.b64encode(buf.tobytes()).decode("utf-8") if ok else ""


@app.get("/health")
def health():
    return {"ok": True, "device": "cuda" if _cuda_available() else "cpu"}


def _cuda_available() -> bool:
    import torch
    return torch.cuda.is_available()


@app.post("/detect/objects")
async def detect_objects(photo: UploadFile = File(...)):
    """Object + obstacle detection on one static photo. Known COCO classes are
    named directly; low-confidence detections are checked against saved
    memory (a name you taught it before) and otherwise returned as an
    "unknown" crop the frontend can offer to save a name for."""
    image = _read_upload(await photo.read())
    if image is None:
        return JSONResponse({"error": "Could not read image"}, status_code=400)

    memory = object_memory.load_memory()
    results = detector.predict(image, verbose=False)[0]

    known, unknown = [], []
    for box in results.boxes:
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        crop = image[max(0, y1):max(0, y2), max(0, x1):max(0, x2)]
        if crop.size == 0:
            continue

        if conf >= OBJECT_CONFIDENCE_THRESHOLD:
            label = detector.names[int(box.cls[0])]
            known.append({"label": label, "confidence": conf, "box": [x1, y1, x2, y2], "source": "detector"})
            continue

        # Low confidence — check if we've been taught this object's name before.
        embedding = _mobilenet_embedding(crop)
        saved_name, sim = object_memory.find_match(embedding, memory)
        if saved_name:
            known.append({"label": saved_name, "confidence": sim, "box": [x1, y1, x2, y2], "source": "memory"})
        else:
            crop_id = uuid.uuid4().hex[:10]
            unknown.append({"crop_id": crop_id, "box": [x1, y1, x2, y2], "crop_base64": _crop_to_base64(crop)})

    if known:
        phrase = None
    elif unknown:
        phrase = PHRASE_SOMETHING_AHEAD
    else:
        phrase = PHRASE_NOTHING_AHEAD

    return {"known": known, "unknown": unknown, "fallback_phrase": phrase}


@app.post("/objects/remember")
async def remember_object(name: str = Form(...), photo: UploadFile = File(...)):
    """Teach the server a name for a previously-unknown crop — call this with
    the exact crop image returned in an earlier /detect/objects response's
    "unknown" list."""
    image = _read_upload(await photo.read())
    if image is None:
        return JSONResponse({"error": "Could not read image"}, status_code=400)
    embedding = _mobilenet_embedding(image)
    object_memory.remember(name.strip(), embedding)
    return {"saved": True, "name": name.strip()}


@app.post("/detect/currency")
async def detect_currency(photo: UploadFile = File(...)):
    """Recognizes a PKR note using the model you already trained earlier —
    no "teach a name" step here, since currency denominations are a fixed,
    known set (unlike open-ended objects), so there's nothing new to learn."""
    image = _read_upload(await photo.read())
    if image is None:
        return JSONResponse({"error": "Could not read image"}, status_code=400)
    result = currency_ai.recognize(image)
    return result or {"denomination": None, "confidence": 0.0}


@app.post("/detect/text")
async def detect_text(photo: UploadFile = File(...)):
    """Reads any printed text in the photo and rewrites it as one clean
    summary string (EasyOCR, pretrained — no training here either)."""
    image = _read_upload(await photo.read())
    if image is None:
        return JSONResponse({"error": "Could not read image"}, status_code=400)
    reader = _get_ocr_reader()
    results = reader.readtext(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    fragments = [text.strip() for (_, text, conf) in results if conf >= 0.35 and text.strip()]
    summary = " ".join(" ".join(fragments).split())
    return {"summary": summary}


@app.post("/speak")
async def speak(text: str = Form(...), lang: str = Form("en")):
    """gTTS voice output — also the fix for Urdu voice quality, since Google's
    cloud voice actually supports 'ur' properly (unlike most browsers'
    locally-installed voices)."""
    if not text.strip():
        return JSONResponse({"error": "empty text"}, status_code=400)
    buf = io.BytesIO()
    gTTS(text=text, lang=lang).write_to_fp(buf)
    return {"audio_base64": base64.b64encode(buf.getvalue()).decode("utf-8"), "mime": "audio/mpeg"}


# ---- shared helpers (embedding reused for both object memory and could be
# swapped for currency.py's embedder if you want a single model later) ----
_embed_backbone = None
_embed_transform = None


def _mobilenet_embedding(image_bgr: np.ndarray) -> np.ndarray:
    global _embed_backbone, _embed_transform
    if _embed_backbone is None:
        import torch
        from torchvision import models, transforms
        _embed_backbone = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        _embed_backbone.classifier = torch.nn.Identity()
        _embed_backbone.eval()
        _embed_transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((160, 160)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    import torch
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    with torch.no_grad():
        tensor = _embed_transform(rgb).unsqueeze(0)
        feat = _embed_backbone(tensor).squeeze(0).numpy()
    return feat / (np.linalg.norm(feat) + 1e-8)


_ocr_reader = None


def _get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        _ocr_reader = easyocr.Reader(["en"], gpu=_cuda_available())
    return _ocr_reader
