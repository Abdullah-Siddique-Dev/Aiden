import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { Button, Badge } from "./ui";
import {
  Sparkles,
  X,
  Mic,
  MicOff,
  Send,
  ArrowRight,
  Compass,
} from "lucide-react";

const SUGGESTED_PROMPTS = [
  { en: "Describe what is around me", ur: "میرے ارد گرد کیا ہے؟", target: "/vision" },
  { en: "Read this text aloud", ur: "یہ تحریر پڑھ کر سنائیں", target: "/text-reader" },
  { en: "Help me practice PSL signs", ur: "اشاروں کی مشق میں مدد کریں", target: "/learning" },
  { en: "How does currency detection work?", ur: "کرنسی نوٹ کیسے پہچانا جاتا ہے؟", target: "/vision" },
  { en: "Start a beginner lesson", ur: "بنیادی سبق شروع کریں", target: "/learning" },
];

export default function AidenAssistantChat({ token, language, speak, t, onClose }) {
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const isUrdu = language === "ur";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [assistantMessages, assistantBusy]);

  async function sendToAssistant(message, targetRoute = null) {
    setAssistantMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, role: "user", text: message },
    ]);
    setAssistantBusy(true);

    try {
      const res = await fetch("/api/agent/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, language }),
      });
      const data = await res.json();
      const reply = data.reply || (isUrdu ? "معذرت، جواب نہیں مل سکا۔" : "Sorry, I couldn't get a reply.");
      setAssistantMessages((m) => [
        ...m,
        {
          id: `local-${Date.now()}-r`,
          role: "assistant",
          text: reply,
          actionTarget: targetRoute,
        },
      ]);
      speak(reply);
    } catch {
      const fallback = isUrdu
        ? "رابطہ نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔"
        : "Couldn't reach the assistant. Please try again.";
      setAssistantMessages((m) => [
        ...m,
        { id: `local-${Date.now()}-r`, role: "assistant", text: fallback, actionTarget: targetRoute },
      ]);
    } finally {
      setAssistantBusy(false);
    }
  }

  function handleSend() {
    if (!text.trim()) return;
    sendToAssistant(text.trim());
    setText("");
  }

  function handlePromptClick(prompt) {
    const promptText = isUrdu ? prompt.ur : prompt.en;
    sendToAssistant(promptText, prompt.target);
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setAssistantMessages((m) => [
        ...m,
        {
          id: `local-${Date.now()}-e`,
          role: "assistant",
          text: isUrdu ? "یہ براؤزر صوتی ان پٹ سپورٹ نہیں کرتا۔" : "This browser doesn't support voice input.",
        },
      ]);
      return;
    }
    const recognition = new SR();
    recognition.lang = isUrdu ? "ur-PK" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) sendToAssistant(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <section className="flex-1 flex flex-col min-w-0 bg-aiden-bg h-full">
      {/* Assistant Header */}
      <header className="border-b border-aiden-border px-4 sm:px-5 py-3.5 bg-aiden-surface flex items-center justify-between shadow-subtle shrink-0">
        <div className="flex items-center gap-3">
          <Avatar expression="happy" size={38} className="shrink-0 drop-shadow-sm" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm sm:text-base font-bold text-aiden-text-primary">
                AIDEN AI Assistant
              </h2>
              <Badge variant="ai" size="sm">
                AI Companion
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-aiden-text-muted">
              {isUrdu ? "صوتی اور تحریری رسائی ساتھی" : "Interactive multimodal assistive copilot"}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="w-8 h-8 rounded-full flex items-center justify-center text-aiden-text-secondary hover:text-aiden-text-primary hover:bg-aiden-surface-secondary transition-colors focus-visible:ring-2 focus-visible:ring-aiden-accent"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3.5">
        {assistantMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-aiden-text-muted">
            <Avatar expression="encouraging" size={84} className="mb-3" />
            <h3 className="font-display text-base sm:text-lg font-semibold text-aiden-text-primary mb-1">
              {isUrdu ? "میں آپ کی کیا مدد کر سکتا ہوں؟" : "How can I help you right now?"}
            </h3>
            <p className={`text-xs sm:text-sm max-w-sm mb-5 text-aiden-text-secondary ${isUrdu ? "font-urdu text-sm" : ""}`}>
              {isUrdu
                ? "آپ تحریری یا صوتی طور پر کوئی بھی سوال پوچھ سکتے ہیں یا نیچے دی گئی تجاویز پر ٹیپ کریں۔"
                : "Ask anything about camera vision, sign translation, reading text, or select a suggested prompt below:"}
            </p>

            {/* Suggested Prompts Cards */}
            <div className="w-full max-w-md space-y-1.5 text-left">
              {SUGGESTED_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(sp)}
                  className="w-full px-3.5 py-2.5 rounded-aiden-md bg-aiden-surface border border-aiden-border/80 hover:border-aiden-primary hover:bg-aiden-primary-light/50 text-xs sm:text-sm text-aiden-text-primary flex items-center justify-between transition-all duration-150 group shadow-subtle"
                >
                  <span className={isUrdu ? "font-urdu" : "font-medium"}>
                    {isUrdu ? sp.ur : sp.en}
                  </span>
                  <ArrowRight className="w-4 h-4 text-aiden-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {assistantMessages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-subtle ${
                m.role === "user"
                  ? "bg-aiden-primary text-white rounded-aiden-lg rounded-br-sm"
                  : "bg-aiden-surface border border-aiden-accent/40 text-aiden-text-primary rounded-aiden-lg rounded-bl-sm"
              } ${isUrdu ? "font-urdu text-base" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-aiden-accent-dark select-none">
                  <Sparkles className="w-3 h-3 text-aiden-accent-dark" />
                  <span>AIDEN</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>

              {m.actionTarget && (
                <div className="mt-3 pt-2 border-t border-aiden-border-subtle">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => {
                      if (onClose) onClose();
                      navigate(m.actionTarget);
                    }}
                    icon={<Compass className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    <span>{isUrdu ? "ٹول کھولیں" : "Launch Recommended Tool"}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {assistantBusy && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-aiden-surface border border-aiden-border px-4 py-2.5 rounded-aiden-lg rounded-bl-sm flex items-center gap-2.5 shadow-subtle">
              <span className="flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-aiden-accent animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-aiden-accent animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-aiden-accent animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="text-xs text-aiden-text-secondary font-medium">
                {isUrdu ? "AIDEN سوچ رہا ہے…" : "AIDEN is thinking…"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts Quick Strip (when chat active) */}
      {assistantMessages.length > 0 && (
        <div className="px-4 py-1.5 bg-aiden-surface-secondary border-t border-aiden-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-bold text-aiden-text-muted shrink-0 mr-1">
            {isUrdu ? "تجاویز:" : "Prompts:"}
          </span>
          {SUGGESTED_PROMPTS.slice(0, 3).map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(sp)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-aiden-surface border border-aiden-border hover:border-aiden-primary text-aiden-text-secondary hover:text-aiden-primary transition-colors whitespace-nowrap"
            >
              {isUrdu ? sp.ur : sp.en}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t border-aiden-border bg-aiden-surface px-4 sm:px-5 py-3 flex items-center gap-2.5 shrink-0 shadow-subtle">
        <Button
          variant={listening ? "danger" : "secondary"}
          size="icon"
          onClick={listening ? stopListening : startListening}
          icon={listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          title={isUrdu ? "بولیں" : "Speak to assistant"}
          className={`shrink-0 ${listening ? "animate-pulse ring-2 ring-aiden-danger" : ""}`}
        />

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("type_message")}
          className={`flex-1 bg-aiden-surface-secondary text-aiden-text-primary text-xs sm:text-sm rounded-aiden-md border border-aiden-border py-2.5 px-3.5 focus:border-aiden-primary focus:ring-2 focus:ring-aiden-primary/20 outline-none transition-all ${
            isUrdu ? "font-urdu text-right text-base" : ""
          }`}
        />

        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={!text.trim() || assistantBusy}
          icon={<Send className="w-4 h-4" />}
          className="shrink-0 font-semibold shadow-sm"
        >
          {t("send")}
        </Button>
      </div>
    </section>
  );
}
