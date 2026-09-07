# AIDEN — Artificial Intelligence for Disability Empowerment Network
## Complete System Documentation

---

## 1. Executive Summary & Overview

**AIDEN** is an inclusive, on-device multimodal AI assistive system designed specifically for **Deaf, Mute, and Visually Impaired individuals in Pakistan**.

### The Problem
- **Lack of Pakistani Localization**: Standard assistive tools do not recognize **Pakistan Sign Language (PSL)** or **Pakistani Rupee (PKR) banknotes**, and rarely speak natural Urdu.
- **Latency & Cloud Dependence**: Streaming continuous video to cloud servers causes dangerous 1–3 second delays for blind navigation and requires heavy bandwidth.
- **Privacy Risks**: Transmitting continuous camera video of a user's home or surroundings over the internet introduces severe privacy vulnerabilities.
- **Hardware Bottlenecks**: Traditional AI tools require 4.5+ GB of heavy Python libraries (`torch`, `ultralytics`, `easyocr`) and expensive GPUs.

### The AIDEN Solution
- **100% On-Device AI Processing**: All computer vision, hand tracking, currency detection, and OCR run locally in the browser via **WebAssembly (WASM)** and **WebGL hardware acceleration**. Video frames never leave the device.
- **Bilingual Experience (Urdu & English)**: Complete UI in Urdu Nastaliq and English, coupled with natural bilingual voice synthesis (TTS) and speech recognition (STT).
- **Sub-20ms Real-Time Inference**: Zero cloud round-trips for vision, enabling immediate audio obstacle narration and sign language translation at 30 FPS.
- **Lightweight Architecture**: Replaces gigabytes of server infrastructure with a lightweight web application that runs on standard laptops and mobile phones.

---

## 2. System Architecture & Tech Stack

```
+-------------------------------------------------------------------------------+
|                             CLIENT BROWSER (User Device)                      |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                   Presentation & Accessibility Layer                    |  |
|  |   * React 18, Vite, Tailwind CSS, Lucide Icons, Bilingual i18n          |  |
|  |   * High-Contrast Dark Mode, Typography Scale, Audio Equalizers         |  |
|  |   * Viewfinder HUD Overlays with Target Alignment Guidance              |  |
|  +-------------------------------------------------------------------------+  |
|                                      |                                        |
|  +-------------------------------------------------------------------------+  |
|  |                    On-Device Neural Engine (WASM / WebGL)               |  |
|  |                                                                         |  |
|  |  * MediaPipe Vision WASM: 21 3D Hand Landmarks @ 30 FPS                |  |
|  |  * ONNX Runtime Web: Quantized PSL & PKR Neural Classifiers             |  |
|  |  * TensorFlow.js Lite: COCO-SSD v2 MobileNet Object Detector            |  |
|  |  * Tesseract.js WASM: Bilingual Urdu (urd) & English (eng) OCR         |  |
|  |  * Few-Shot KNN Engine: Browser-native live banknote training           |  |
|  |  * Web Speech API: Bilingual voice synthesis & speech-to-text           |  |
|  +-------------------------------------------------------------------------+  |
+--------------------------------------|----------------------------------------+
                                       | WebSocket / REST (Lightweight JSON only)
+--------------------------------------v----------------------------------------+
|                          BACKEND SERVER (Node.js / Express)                    |
|                                                                               |
|  * Socket.io Signaling: Real-time WebRTC calling & chat messaging            |
|  * SQLite Database (`better-sqlite3`): User profiles & message history         |
|  * OpenRouter LLM Gateway: Multimodal conversational intelligence            |
+-------------------------------------------------------------------------------+
```

---

## 3. Core Features & Workstations

### 3.1 Spatial Vision & Narration Workstation (`/vision`)
- **Real-Time Spatial Obstacle Narration**: Continuous 30 FPS object detection classifying items into 3 spatial zones:
  - *Left*: `"بائیں طرف"` / `"on the left"`
  - *Center*: `"سامنے"` / `"ahead"`
  - *Right*: `"دائیں طرف"` / `"on the right"`
- **Proximity Safety Alerts**: Automatically measures bounding box area relative to viewport; alerts `"بہت قریب"` / `"very close"` when an obstacle exceeds 35% of the frame.
- **Custom Object Learning**: Users can tap any detected object to assign custom personal names (e.g. *"My Medicine Bottle"*, *"Mom's Glasses"*), stored in local storage and vocalized upon future detection.
- **One-Tap Multimodal Scene Analysis**: Combines objects, text, and currency into a single comprehensive situational report.
- **Camera Viewport Controls**: Glowing gold `#E8B44F` bounding boxes, HUD status badges, and instant front/rear camera flip.

---

### 3.2 Pakistani Rupee (PKR) Currency Identifier (`/vision`)
- **Denominations Recognized**: Rs. 10, Rs. 20, Rs. 50, Rs. 100, Rs. 500, Rs. 1,000, and Rs. 5,000.
- **Dual Neural Architecture**:
  1. *ONNX Neural Classifier (`currency_model.onnx`)*: Pre-trained deep learning model running via ONNX Runtime Web.
  2. *Few-Shot KNN Transfer Learning*: Users can tap denomination buttons to train custom examples on the fly for difficult lighting conditions.
- **Viewfinder & Showcase UI**:
  - In-viewfinder target guideline with pulsing banknote icon: *"Align Banknote in Frame / نوٹ کو فریم کے اندر رکھیں"*.
  - Showcase card displaying Pakistani Rupee emblem (`₨`), denomination header (`Rs. X PKR`), confidence match percentage, and audio replay button.

---

### 3.3 SignTalk — Pakistan Sign Language (PSL) Translator (`/sign`)
- **21-Point Skeletal Hand Tracking**: Tracks 21 three-dimensional landmarks per hand via MediaPipe Vision WASM at 30 FPS.
- **Real-Time Gesture Vocabulary**: Translates 20 core daily signs: *Hello, Yes, No, Thank You, Help, Please, Sorry, OK, Water, Food, Home, School, Mom, Dad, Friend, Love, Name, Good, Bye, Stop*.
- **4-Stage AI Pipeline**:
  1. *Listening*: Waiting for hands in frame.
  2. *Analyzing*: Tracking landmark stability and joint positions.
  3. *Recognized*: Validating confidence threshold (>55%) and hold duration (650ms).
  4. *Speaking*: Vocalizing translation in Urdu/English with animated wave bars.
- **Viewfinder & History**: Hand alignment guideline, camera flip control, and chronological session sign history.

---

### 3.4 Text Reader & Signboard OCR (`/text-reader`)
- **Bilingual OCR**: Scans printed text from books, medicine labels, food packaging, and street signs using client-side Tesseract.js (`urd+eng`).
- **Autonomous Reading Loop**: Automatically reads new text aloud every 2.6 seconds, ignoring duplicates to prevent repetitive looping.
- **Interactive Controls**: Document alignment frame, 1-click **Copy Text** button, and **Listen** audio button.

---

### 3.5 Interactive Sign Academy (`/learning`)
- **Structured PSL Curriculum**:
  - *Level 1 (Foundations)*: Digits (0–9), English Alphabet (A–Z), Urdu Huroof-e-Tahaji (ا سے ے).
  - *Level 2 (Essential Words)*: Family, food, greetings, emotions, and emergency signs.
- **Interactive Flashcards & Teacher Avatar**: High-resolution diagrams, plain-language gesture instructions, and audio narration.
- **Gamified Progress**: Tracks completed lessons and rewards milestone achievements with celebration animations.

---

### 3.6 Accessible Messaging & WebRTC Video Calling (`/chat`)
- **Inclusive Chat**: Supports text messages, voice notes with inline audio player, recorded video snippets, and one-tap camera detection cards.
- **Peer-to-Peer Encrypted WebRTC Calls**: Direct browser-to-browser audio and video calling with microphone mute, camera toggle, and duration counter.

---

### 3.7 Multimodal AI Copilot (`AidenAssistantChat`)
- **Always-Available Assistive Companion**: Floating AI assistant accessible from any screen.
- **Voice & Text Queries**: Talk naturally using Web Speech Recognition in Urdu or English.
- **LLM Intelligence**: Powered by OpenRouter gateway (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) to provide context-aware answers and direct feature navigation.

---

### 3.8 Accessibility & System Health Dashboard (`/settings`)
- **Visual Customizations**: High-contrast theme (yellow/black dark mode), 4 typography scale levels (Small to Extra Large), and bilingual language toggle.
- **Live On-Device Health Matrix**: Real-time diagnostics verifying local backend status, WASM neural models, camera ingest, and speech synthesis engines.

---

## 4. Client-Side Machine Learning Model Specifications

| Capability | Model Architecture | Format | Size (Gzip) | Execution Environment | Privacy |
|---|---|---|---|---|---|
| **Object Detection** | MobileNet v2 Lite (COCO-SSD) | TF.js | ~2.1 MB | WebGL / WASM | 100% Local |
| **Hand Tracking** | MediaPipe Hand Landmarker | WASM + Task | ~9.8 MB | WebAssembly (GPU) | 100% Local |
| **PSL Sign Classifier** | Pruned Random Forest | ONNX Web | ~520 KB | WASM SIMD Threaded | 100% Local |
| **PKR Currency Classifier** | MobileNet Neural Graph | ONNX Web | ~610 KB | WASM SIMD Threaded | 100% Local |
| **Bilingual OCR** | Tesseract.js WASM | WASM Worker | ~4.2 MB | Web Worker | 100% Local |
| **Speech-to-Text** | Web Speech STT | Native API | 0 KB | Operating System | Local Audio |
| **Text-to-Speech** | Web Speech Synthesis | Native API | 0 KB | Operating System | 100% Local |

---

## 5. Quick Start & Execution

### 1. Start Backend Server
```bash
cd LIGHT_WORK/backend
npm install
npm start
```
*Backend runs on `http://localhost:4000` with WebSocket signaling and SQLite database.*

### 2. Start Frontend Application
```bash
cd LIGHT_WORK/frontend
npm install
npm run dev
```
*Application opens at `http://localhost:5173`.*

### 3. Production Build
```bash
npm run build
```
*Verifies 0 compilation errors across all modules.*
