import { Router } from "express";
import { authMiddleware } from "./auth.js";

const router = Router();

// AIDEN's LLM brain runs through OpenRouter (https://openrouter.ai), which gives
// one OpenAI-compatible API key access to many models (Claude, GPT, Gemini, Llama,
// DeepSeek, etc). Pick any model slug from https://openrouter.ai/models and set it
// in OPENROUTER_MODEL — no code changes needed to switch models.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";
const SITE_URL = process.env.SITE_URL || "http://localhost:5173";

const SYSTEM_PROMPT = `You are AIDEN (Artificial Intelligence for Disability Empowerment Network), a warm,
patient assistant embedded in an accessibility app used by deaf, mute, and visually impaired people in Pakistan,
plus their teachers and caregivers. You respond in the language you are told to use (English or Urdu).
Keep replies short (1-3 sentences), clear, concrete, and encouraging. If the user is asking about a PSL sign,
object, currency note, or text you already told them about via the app's vision tools, weave that fact in naturally.
Never use jargon. If input seems to come from vision/sign tools rather than typed chat, respond as if continuing
a spoken conversation, not as a system log.`;

router.post("/respond", authMiddleware, async (req, res) => {
  const { message, language = "en", context } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  if (!OPENROUTER_API_KEY) {
    // Graceful offline fallback so the app still functions without an API key configured.
    const fallback =
      language === "ur"
        ? "Mujhe abhi AI dimaagh se rabta nahi ho raha, lekin main sun raha hoon. Server par OPENROUTER_API_KEY set karein."
        : "I can't reach my AI brain right now, but I'm listening. Please set OPENROUTER_API_KEY on the server.";
    return res.json({ reply: fallback, offline: true });
  }

  try {
    const langInstruction =
      language === "ur"
        ? "Reply in Urdu script (not romanized), simple everyday words."
        : "Reply in clear, simple English.";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL, // required by OpenRouter for attribution/rate limits
        "X-Title": "AIDEN",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 300,
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\n${langInstruction}` },
          { role: "user", content: context ? `Context: ${context}\n\nUser: ${message}` : message },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenRouter error:", response.status, errBody);
      return res.status(502).json({ error: "AIDEN's brain (OpenRouter) had trouble responding." });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    res.json({ reply: text || "..." });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ error: "AIDEN's brain had trouble responding. Please try again." });
  }
});

export default router;
