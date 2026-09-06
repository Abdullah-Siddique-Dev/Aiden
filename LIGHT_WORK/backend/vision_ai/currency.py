"""
Wraps the already-trained currency_model.pkl (MobileNet-v2 embedding ->
RandomForestClassifier, trained earlier on real PKR note photos). Nothing
here is retrained — this just loads the existing model and runs it.
"""
import os

import cv2
import joblib
import numpy as np
import torch
from torchvision import models, transforms

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "currency_model.pkl")
_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
_CONFIDENCE_THRESHOLD = 0.55

_bundle = joblib.load(_MODEL_PATH)
_clf = _bundle["model"]
_label_encoder = _bundle["label_encoder"]

# The trained classifier expects 512-dim embeddings — that's ResNet18's
# avgpool output size exactly (MobileNetV2 gives 1280, which doesn't match
# and would silently break predictions), so that's what this was trained on.
_backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
_backbone.fc = torch.nn.Identity()
_backbone.eval().to(_DEVICE)

_transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


@torch.no_grad()
def _embed(image_bgr: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    tensor = _transform(rgb).unsqueeze(0).to(_DEVICE)
    return _backbone(tensor).squeeze(0).cpu().numpy().reshape(1, -1)


def recognize(image_bgr: np.ndarray) -> dict | None:
    """Returns {"denomination": "500", "confidence": 0.93} or None if not confident."""
    embedding = _embed(image_bgr)
    probs = _clf.predict_proba(embedding)[0]
    best_idx = int(np.argmax(probs))
    confidence = float(probs[best_idx])
    if confidence < _CONFIDENCE_THRESHOLD:
        return None
    label = _label_encoder.inverse_transform([best_idx])[0]  # e.g. "500_front"
    denomination = str(label).replace("_front", "").replace("_back", "")
    return {"denomination": denomination, "confidence": confidence}
