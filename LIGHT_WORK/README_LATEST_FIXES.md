# AIDEN — Fixes Applied (This Round)

## 1. Voice Silent Everywhere — Root Cause Found & Fixed

**Wajah**: Browsers (Chrome/Edge/Safari) apni pehli `speechSynthesis` call ko **block**
kar dete hain agar woh kisi real click/tap ke bina ho — aur Learning tab ka auto-play
(jo bina click ke chalta hai) **exactly yehi** kar raha tha. Ek dafa yeh block ho jaye,
to kai browsers **poori session ke liye** har baad ki speak() call bhi chup rehti hai —
isi liye call, detection, live-guide, learning, chat **sab jagah** silent tha, ek hi
root cause se.

**Fix**: `AppContext.jsx` mein ab ek **global one-time unlock** hai — page pe kahin bhi
pehla click/tap/key-press hote hi voice engine "unlock" ho jata hai, aur jo bhi text
tab tak queue mein tha, woh turant bol diya jata hai. Jab tak unlock nahi hua, ek chhota
banner dikhta hai: **"Tap anywhere once to enable voice"** — silent fail nahi hota, user
ko pata chalta hai.

## 2. Call Mein Awaaz Nahi Aati Thi

Video/voice call connect ho jaata tha (picture aati thi) lekin **awaaz nahi** — yeh
alag bug tha: remote stream `<video>` element ko asynchronously (JS se) di ja rahi thi,
aur browser is tarah ke unmuted-audio-autoplay ko silently block kar deta hai. Ab
`ontrack` handler explicitly `.play()` call karta hai, aur agar phir bhi block ho to
ek **"Tap to enable call audio"** button dikhta hai — silent nahi.

## 3. Detection — Behtar Kiya (Custom Model Abhi Nahi, Jaisa Tumne Kaha)

Detection "minimum" hone ki wajah: agar koi bhi model (sign/currency/text/object) apni
strict confidence line clear na kare, pehle **kuch bhi nahi** dikhta tha. Ab agar sab
strict fail ho jayein, best-effort guess **"Maybe: X"** ke saath dikhta hai (fake
certainty nahi, lekin kuch to milta hai). Confidence lines waisi hi rakhi hain (change
karne se galat results zyada aa sakte the).

Chat tab ka detection ab **result bolta bhi hai** (pehle sirf likhta tha) — object ho ya
currency ho, dono ab TTS se bolte hain.

## 4. Sign Pictures — Wire Kar Diye (Sab 103 Real Images)

Pehle `signImages.js` mein sab entries `null` thi (manually add karna tha). Maine
tumhari **pehle wali project ki asal images** (jo already ban chuki thi, dobara banwani
nahi padi) use kar ke poora map bhar diya:

- Digits 0-9 (10 images) ✅
- English A-Z (26 images) ✅
- Urdu huroof-e-tahaji (37 images) ✅
- PSL common words — sab 20 ✅
- Counting by 10s (10 images) ✅

Learning tab aur Sign Talk tab dono ab **real pictures** dikhayenge, animated avatar
nahi.

## 5. Naya Tab — Text Reader / Screen Analyzer

Jaisa tumne bataya — koi bhi text (kisi object, page, screen, jagah pe) camera ke
saamne lao, yeh continuously scan karta hai, screen pe **rewrite** karta hai, aur
**bolta hai**. Koi custom model nahi chahiye (Tesseract.js browser mein hi chalta hai)
— baad mein agar accuracy improve karni ho to isi structure mein custom model swap ho
sakta hai bina kuch tod'e.

Sidebar mein naya tab: **"Text Reader"** (📖 icon).

---

## Honest Note — Jo Abhi Bhi Limitation Hai

Client-side lightweight models (ONNX/TF.js/Tesseract) ki apni ek accuracy ceiling hoti
hai — yeh server-side heavy models jitne accurate kabhi nahi honge. "Maybe: X" wala
fallback isi limitation ko transparently handle karta hai, chhupata nahi. Agar future
mein zyada accuracy chahiye, custom-trained model (jaisa tumne khud pehle banaya tha)
zaroori hoga — abhi ke liye jo bhi fix ho sakta tha bina naya model banaye, woh sab kar
diya hai.

## Setup

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Koi cheez expected na ho, exact console error/behavior bhej dena.
