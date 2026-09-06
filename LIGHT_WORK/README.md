# AIDEN — Light Version

**Artificial Intelligence for Disability Empowerment Network**

A lighter, browser-based rebuild of AIDEN. Same 17 features as the original spec, rebuilt to
avoid the ~4.5GB Python ML stack (torch, ultralytics, mediapipe, easyocr) by running most AI
inference **in the browser** with small, purpose-picked models, and keeping the backend to a thin
Node/Express + SQLite layer.

## Stack, and why it's lighter

| Concern | Original | This build | Why lighter |
|---|---|---|---|
| Backend | FastAPI + heavy Python ML deps | Node/Express + SQLite (`better-sqlite3`) | No Python ML runtime on the server at all |
| Object detection | ultralytics (YOLO, PyTorch) | TensorFlow.js `coco-ssd` (lite MobileNet v2), runs client-side | ~6MB model, downloaded once, cached by the browser |
| OCR | easyocr (PyTorch) | `tesseract.js` (WASM), client-side | No server round-trip, no GPU needed |
| Sign recognition | (n/a in spec — new) | MediaPipe Hand Landmarker + geometric matcher, client-side | No dataset to ship; ~10MB WASM+model, cached |
| Currency recognition | (n/a in spec — new) | MobileNet + KNN, few-shot, client-side | No training pipeline; a few taps per note is enough |
| STT / TTS | mediapipe / custom | Browser Web Speech API | Zero extra dependencies |
| LLM brain | self-hosted or API | **OpenRouter API** (any model) | One key, no local LLM weights, swap models freely |

The frontend is also code-split: the initial app bundle is ~250KB (gzip ~80KB). The
TensorFlow.js/MediaPipe/Tesseract bundle (~2MB) only downloads when a user opens **Camera Guide**
or **Sign Talk** — someone who only uses chat, learning, or calling never pays that cost.

## Honesty about the two hardest features

**Update:** both now use the real models trained on the original PSL/currency datasets,
compressed and converted to ONNX (pruned RandomForest, ~500KB–600KB gzip each) so they run
fully client-side via `onnxruntime-web` — no server inference, no huge downloads. The original
from-scratch fallbacks below still ship as a safety net if the ONNX model fails to load
(offline, blocked CDN, etc.) — the app never crashes over it, it just quietly degrades to these:

There is no public trained model or dataset for **Pakistan Sign Language** or **Pakistani currency
notes**. Rather than stub these out or fake them, both use real, working, from-scratch approaches
that need no pre-existing dataset:

- **Sign Talk**: MediaPipe extracts 21 hand landmarks per frame; we compute finger-curl, pinch
  distance, and hand region, and match against hand-authored templates for the 20 supported signs.
  This is a genuine nearest-template classifier — good enough to demo and teach with, not
  production-accuracy. Swapping in a properly trained model (fine-tuned on real PSL video) is a
  drop-in replacement for `frontend/src/lib/signClassifier.js`.
- **Currency**: MobileNet (pretrained on ImageNet) extracts an embedding per frame, and a KNN
  classifier is trained live — the user shows each note once and taps its denomination. Same
  technique as Google's Teachable Machine. No dataset, no training step, works today.

Both are clearly labeled "beta" in the UI so this is never misrepresented to users who may be
relying on it for safety (e.g. crossing a road, verifying money).

## Project structure

```
aiden/
  backend/
    server.js          Express + Socket.io entrypoint
    db.js               SQLite schema
    routes/              auth, users, chat, agent (LLM), signs
    data/signs.js         20 PSL signs + curriculum
    uploads/              chat attachments (voice/image/video)
  frontend/
    src/
      pages/               Home, Vision, SignTalk, Learning, Chat, Calls, Settings, About, Login, Signup
      components/Avatar.jsx  animated SVG cartoon teacher
      lib/                  camera hook, speech hook, sign classifier, currency KNN, socket client
      context/               Auth + App (language/accessibility) providers
      i18n/                  en.json / ur.json
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set JWT_SECRET, and OPENROUTER_API_KEY for the LLM brain (see below)
npm start
```

Runs on `http://localhost:4000`. Without `OPENROUTER_API_KEY` set, chat still works but AIDEN
replies with a fallback message telling you the key is missing (the app doesn't crash).

#### LLM brain: OpenRouter setup

AIDEN's "brain" (`backend/routes/agent.js`) calls **OpenRouter** (openrouter.ai) instead of any
single AI provider directly. OpenRouter gives you one API key that can call almost any model —
Claude, GPT, Gemini, Llama, DeepSeek, etc — through a single OpenAI-compatible endpoint, so you can
change models later just by editing an env var, no code changes.

1. Create an account at **https://openrouter.ai**
2. Add credit (or use free-tier models — some are marked `:free` on the models page) at
   **https://openrouter.ai/credits**
3. Create an API key at **https://openrouter.ai/keys**
4. In `backend/.env`, set:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...your key...
   OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
   SITE_URL=http://localhost:5173
   ```
   `OPENROUTER_MODEL` can be any slug from **https://openrouter.ai/models**, for example:
   - `anthropic/claude-sonnet-4.5`
   - `openai/gpt-4o-mini`
   - `google/gemini-2.5-flash`
   - `meta-llama/llama-3.3-70b-instruct`
   - `deepseek/deepseek-chat`

   `SITE_URL` is sent as OpenRouter's required `HTTP-Referer` header (used for attribution and
   rate-limit tracking on their side) — set it to your real deployed domain in production.
5. Restart the backend. Chat on the **Home** page and the reply confirms it's live.

If a request to OpenRouter fails (bad key, model unavailable, rate limit), the backend logs the
exact status/response from OpenRouter to the console and returns a friendly error to the app
instead of crashing.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api`, `/uploads`, and `/socket.io` to the backend.

Open it in **Chrome** (best Web Speech API + camera support), grant camera/microphone permission,
and sign up.

### 3. Try every feature

1. Sign up, pick "Deaf person" or any role, choose English or Urdu.
2. **Home** — type or tap the mic and talk to AIDEN; it replies in text, speech, and the avatar reacts.
3. **Camera Guide** — start the camera, try Narrate / Detect objects / Read text / Currency.
   For currency, show a note and tap its amount 2–3 times from different angles, then tap Identify.
4. **Sign Talk** — hold up a PSL hand shape (e.g. open palm near your face for "Hello") and hold still.
5. **Learning** — browse lessons, tap "Hear it again" to have the avatar teach each sign.
6. **Chat** — sign up a second account in another browser tab, search for it, message, send a photo/voice note.
7. **Calls** — from the two accounts, start a voice or video call.
8. **Settings** — switch language, font size, and high-contrast mode; the whole app re-renders in Urdu (RTL).

## Deployment

**Backend** — deploy `backend/` to any Node host (Render, Railway, Fly.io, a VPS with `pm2`).
Set `JWT_SECRET` and `ANTHROPIC_API_KEY` as environment variables. `aiden.db` (SQLite) persists to
disk — for multi-instance deployments, swap `better-sqlite3` for a hosted Postgres and update
`db.js` accordingly (schema is simple and portable).

**Frontend** — `npm run build` in `frontend/` produces static files in `frontend/dist/`. Deploy to
Vercel, Netlify, or any static host. Set the backend's public URL and update the Vite proxy /
Socket.io connection URL (`frontend/src/lib/socket.js`) to point at it, since a static host can't
proxy `/api` for you. Serve everything over **HTTPS** — camera/microphone access requires a secure
context in production.

**Uploads** — `backend/uploads/` stores chat attachments on local disk by default. For production,
point `routes/chat.js`'s multer storage at S3-compatible object storage instead.

## Known limitations (be upfront with users)

- Sign and currency recognition are beta-grade heuristic/few-shot models, not trained on real PSL
  or PKR datasets — accuracy will vary with lighting, hand shape, and camera angle.
- Web Speech API's Urdu support varies by browser/OS; Chrome on desktop has the most reliable
  `ur-PK` voice and recognition support at the time of writing.
- WebRTC calling here uses a public STUN server only (no TURN), so calls between users on
  restrictive corporate/mobile networks may fail to connect peer-to-peer; add a TURN server
  (e.g. Twilio, coturn) for production reliability.
