# AIDEN — Product Requirements Document

## What is AIDEN?
AIDEN is a web app that acts as a **translator and accessibility companion**
between deaf, mute, and visually impaired users and the hearing/sighted people
around them (family, teachers, friends). It turns sign language, printed text,
currency notes, and everyday objects into speech/text, and turns speech/text
back into a form everyone in a conversation can understand — in real time,
one-on-one, in a browser.

## Who is it for?
- **Deaf users** — read spoken messages as text, see sign detected and sent as text/speech to the other side.
- **Mute users** — sign into the camera instead of typing/speaking; the app announces it for them.
- **Visually impaired users** — a "Live Guide" narrates what's in front of the camera (people, obstacles, currency, printed text) via speech.
- **Family, teachers, caregivers** — chat normally; AIDEN bridges the gap without either side needing special hardware.

## Feature list (by tab)
| Tab | Purpose |
|---|---|
| **Home** | Entry point / quick links to the tabs below. |
| **About** | What AIDEN is and who it's for (public-facing). |
| **Chat** | Real-time 1:1 messaging (Socket.io), voice notes, video clips, in-chat "Detect & Send" (sign/currency/text/object → sent as a message both sides see and hear), and a pinned AIDEN Assistant chat. |
| **Calls** | WebRTC video/audio calling between two accounts. |
| **Live Guide (Vision)** | Camera-based narration: object categories, currency, printed text (OCR), with a one-tap "Analyze" that combines all three and flags close obstacles. |
| **Sign Talk** | Standalone PSL sign detection/practice tool (camera → MediaPipe hand landmarks → trained ONNX classifier → speech). |
| **Learning** | Curriculum: Level 1 (digits, English A-Z, Urdu huroof) and Level 2 (PSL words, counting by 10s), every item with audio. |
| **Settings** | Language, font size, high contrast, profile, and a live-computed "About This App" status panel. |

## Tech stack & architecture decision: client-side ML, light server
- **Backend**: Node.js + Express + Socket.io + better-sqlite3 + JWT auth + multer (file uploads). Handles accounts, chat persistence, real-time messaging/call signaling, and proxies the AI chatbot to OpenRouter.
- **Frontend**: React + Vite + Tailwind.
- **ML runs entirely in the browser** — this is a deliberate choice, not a shortcut:
  - `@mediapipe/tasks-vision` for hand landmark extraction.
  - `onnxruntime-web` running trained scikit-learn models (RandomForest/SVM) exported to ONNX, for PSL sign, currency, English/Urdu/digit classifiers.
  - `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` for general object detection.
  - `@tensorflow-models/mobilenet` for currency image embeddings.
  - `tesseract.js` for OCR (printed text).
  - Browser Web Speech API for TTS/STT.
- **Why**: this keeps the running server tiny (no GPU, no PyTorch, no multi-GB
  Docker image, deployable on a free-tier VM or even serverless Node) while
  still giving every user real, working ML — the trained models were produced
  offline (one-time Python training scripts, not part of the running app) and
  shipped as small `.onnx` files (compressed/pruned to under ~1MB each in most
  cases). The server's only job is accounts, messages, and call signaling —
  it never has to run inference.

## Non-goals
- No server-side ML inference, no GPU requirement to run the app day-to-day.
- No fabricated results: if a feature genuinely can't work without data we
  don't have, it's labeled as a text-only/placeholder honestly rather than
  faked.
