# AIDEN — Artificial Intelligence for Disability Empowerment Network
> An on-device, privacy-first assistive platform built for Pakistan's Deaf, Mute, and Visually Impaired community.

---

## Why We Built AIDEN

If you walk through a bustling bazaar in Karachi or Lahore, you quickly realize how hostile our everyday world is for someone with a disability. 

A visually impaired person has to trust a stranger to tell them if they just handed over a 1,000-rupee note or a 100-rupee note. A deaf individual walking into a government office or clinic is met with confusion because almost nobody outside their immediate circle knows Pakistan Sign Language (PSL). 

Most modern AI apps make huge promises, but they completely fail in Pakistan:
1. **They don't speak our language**: Almost none of them understand Urdu voice or regional PSL gestures.
2. **They can't recognize Pakistani money**: Commercial vision models know USD and Euros, but have zero clue what a 500 PKR note looks like.
3. **They send everything to the cloud**: Streaming continuous camera video over expensive 4G data creates a 2-second delay. If you're blind and about to bump into an obstacle, a 2-second delay is dangerous.
4. **They require heavy machines**: Existing open-source research models demand a 5GB Python environment with PyTorch and dedicated GPUs that an ordinary laptop or smartphone cannot run.

We built **AIDEN** to change that. We wanted something fast, lightweight, and localized that runs directly in the user's browser, respects their privacy, and actually speaks their language.

---

## How It Works (The Engineering Behind the Magic)

Instead of running a heavy, expensive server with monster GPUs, we moved the entire intelligence stack **directly into the user's web browser**. 

Here is why that matters:
- **Zero Video Latency**: When you point your camera at an obstacle or sign, inference happens locally in under 20 milliseconds.
- **Total Privacy**: Your camera feed never leaves your device. Not a single video frame is sent over the internet or saved on an external server.
- **Runs on Everyday Hardware**: By using WebAssembly (WASM) and WebGL acceleration, AIDEN runs smoothly on standard consumer laptops and phones without requiring an Nvidia graphics card.

### Architecture Overview

```
+---------------------------------------------------------------------------------+
|                        USER'S BROWSER (Laptop or Phone)                         |
|                                                                                 |
|  [ User Interface & Accessibility Engine ]                                      |
|    - React 18, Vite, Tailwind CSS, Lucide Icons                                 |
|    - Native Urdu Nastaliq & English Bilingual Interface                         |
|    - High-Contrast Theme (Dark & High-Vis Yellow)                               |
|    - Viewfinder HUDs with Alignment Targets & Camera Flip                       |
|                                                                                 |
|  [ In-Browser Machine Learning (WASM + WebGL) ]                                 |
|    - MediaPipe Vision: 21 3D hand joints tracked at 30 FPS                      |
|    - ONNX Runtime Web: Lightweight PSL & PKR classification                     |
|    - TensorFlow.js (COCO-SSD v2): 3D spatial obstacle narration                 |
|    - Tesseract.js: Client-side Urdu & English printed text OCR                 |
|    - Few-Shot KNN Engine: Instant on-the-fly local training                    |
|    - Web Speech API: Natural bilingual voice synthesis & voice recognition     |
+---------------------------------------------------------------------------------+
                                         |
                       Lightweight WebSocket / JSON REST
                                         |
+----------------------------------------v----------------------------------------+
|                                NODE.JS BACKEND                                  |
|                                                                                 |
|    - SQLite (`better-sqlite3`): Fast, zero-config database for user accounts    |
|    - Socket.io: WebRTC signaling for peer-to-peer encrypted video calls         |
|    - OpenRouter Gateway: Pluggable multimodal LLM for the AI Copilot           |
+---------------------------------------------------------------------------------+
```

---

## What AIDEN Actually Does (Feature Walkthrough)

### 1. Spatial Vision & Obstacle Narration (`/vision`)
Think of this as a digital co-pilot for someone who cannot see. You turn on the camera, and AIDEN continuously scans the room at 30 frames per second.
- **Where things are**: It doesn't just say *"chair"*. It tells you *"There is a chair on your left"* or *"Chair ahead"*.
- **Safety warnings**: If an object takes up more than a third of the screen, AIDEN immediately warns: *"Very close!"* (*"بہت قریب"*).
- **Teach it your own things**: Everyone has items unique to them. A user can point to an object, tap **Remember**, and label it *"My blood pressure pills"* or *"Ami's glasses"*. From then on, AIDEN recognizes that exact item.
- **One-Tap Scene Analysis**: Need a quick read of the whole room? Tap one button, and AIDEN scans for objects, text, and money all at once, speaking a complete summary aloud.

### 2. Pakistani Rupee (PKR) Currency Identifier (`/vision`)
Handling cash independently is a basic human right. We built a dedicated banknote recognizer for all 7 circulating Pakistani notes: **Rs. 10, 20, 50, 100, 500, 1,000, and 5,000**.
- **Dual AI Approach**: We ship a trained ONNX neural model that recognizes notes out of the box. But because cash in Pakistan is often crumpled, folded, or used in dim shops, we also built in a **live few-shot trainer**. You can tap a button to show your own note to the camera twice, and AIDEN learns it on the spot.
- **Clear Feedback**: When a note is detected, a large golden badge appears with the `₨` symbol, the exact denomination, a match percentage, and a button to replay the voice announcement.

### 3. SignTalk — Pakistan Sign Language Translator (`/sign`)
For deaf and mute individuals, communicating with people who don't know PSL is an everyday barrier. SignTalk bridges this gap.
- **21 Joint Hand Skeleton**: MediaPipe tracks every finger knuckle in 3D space.
- **Real-Time Speech**: When you hold up a PSL sign (like *Hello*, *Thank You*, *Water*, *Help*, *Food*, *Stop*, etc.), AIDEN recognizes it within 650 milliseconds and speaks the translation aloud in natural Urdu or English.
- **Visual Confidence**: A 4-stage pipeline indicator (*Listening → Analyzing → Recognized → Speaking*) shows exactly what the AI is thinking, complete with a history strip of recently spoken signs.

### 4. Text Reader & Signboard OCR (`/text-reader`)
Reading the world around you shouldn't require asking for favors.
- **Point and Listen**: Point your camera at a book, a medicine prescription, a food package, or a street sign. AIDEN automatically reads the text aloud.
- **Bilingual OCR**: Powered by client-side Tesseract WASM with full support for both Urdu and English script.
- **Built for Ease**: Features a target frame so you know where to hold the paper, plus one-tap **Copy Text** and **Listen Again** buttons.

### 5. Interactive Sign Academy (`/learning`)
Learning Pakistan Sign Language shouldn't be boring or locked inside expensive specialized institutes.
- **Structured Curriculum**:
  - **Level 1**: Numbers ($0-9$), English alphabet ($A-Z$), and Urdu Huroof-e-Tahaji ($ا$ سے $ے$).
  - **Level 2**: Essential daily communication words for family, food, emotions, and emergencies.
- **Friendly Teacher**: Features visual flashcards, clear physical hand cues (*e.g., "Fist nods up and down like a small hammer"*), audio narration, and celebration confetti when you master a lesson.

### 6. Accessible Messaging & WebRTC Video Calls (`/chat`)
Communication works best when everyone can join in their preferred way.
- **Multimodal Chat**: Send text, record voice notes with inline audio playback, send quick video snippets, or even share camera detection cards directly inside the conversation.
- **Encrypted WebRTC Video Calling**: Free, direct peer-to-peer calling. No expensive third-party video platforms. Includes camera flip, microphone mute, and autoplay audio unlock.

### 7. Floating AI Copilot (`AidenAssistantChat`)
Available anywhere on the site with a single click.
- Talk to it using your voice or type queries.
- Powered by OpenRouter, meaning we can connect it to state-of-the-art models (Claude 3.5 Sonnet, GPT-4o, Llama 3) without changing a single line of frontend code.
- Smart navigation: Ask *"How do I practice signs?"* and it takes you straight to the Academy.

### 8. Accessibility & Diagnostics Center (`/settings`)
Built from day one following WCAG 2.1 AAA accessibility guidelines.
- **High-Contrast Theme**: High-visibility yellow on deep black for low-vision users.
- **Custom Font Sizes**: 4 text scaling options from Small to Extra Large.
- **Live System Health Matrix**: A built-in dashboard checking the health of your camera, speech synthesis, microphone, and on-device neural models so you know everything is operational before you start.

---

## Machine Learning Models at a Glance

| Feature | Model | How It Runs | Size | Cloud Data Sent? |
|---|---|---|---|---|
| **Obstacle Detection** | MobileNet v2 Lite (COCO-SSD) | TensorFlow.js (WebGL) | ~2.1 MB | **None (100% Local)** |
| **Hand Landmark Tracking** | MediaPipe Hand Landmarker | WASM + GPU Delegate | ~9.8 MB | **None (100% Local)** |
| **PSL Gesture Classifier** | Pruned Random Forest | ONNX Runtime Web (WASM) | ~520 KB | **None (100% Local)** |
| **PKR Currency Recognizer**| MobileNet Feature Extractor | ONNX Runtime Web (WASM) | ~610 KB | **None (100% Local)** |
| **Printed Text Reader** | Tesseract.js (Urdu + English) | WebAssembly Worker | ~4.2 MB | **None (100% Local)** |
| **Voice Narration (TTS)** | Web Speech Synthesis | Browser Native API | 0 KB | **None (100% Local)** |
| **Voice Input (STT)** | Web Speech Recognition | Browser Native API | 0 KB | **Audio only** |
| **Conversational Brain** | OpenRouter Gateway | REST API | N/A | **Text prompt only** |

---

## How to Run It in 2 Minutes

### 1. Start the Backend
```bash
cd LIGHT_WORK/backend
npm install
npm start
```
*The server starts up on `http://localhost:4000` with the SQLite database and WebSocket signaling ready.*

### 2. Start the Frontend
```bash
cd LIGHT_WORK/frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser. Allow camera and microphone permissions when prompted.*

### 3. Verify Production Build
```bash
npm run build
```
*Vite compiles the entire application cleanly into `dist/` with 0 errors.*

---

## What's Next?
We built AIDEN as a working proof that assistive technology doesn't have to be slow, expensive, or foreign. It can be fast, localized, private, and genuinely helpful to the millions of Pakistanis who navigate the world differently every day.
