import { useEffect, useRef, useState } from "react";

export default function AidenAssistantChat({ token, language, speak, t }) {
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [assistantMessages]);

  async function sendToAssistant(message) {
    setAssistantMessages((m) => [...m, { id: `local-${Date.now()}`, role: "user", text: message }]);
    setAssistantBusy(true);
    try {
      const res = await fetch("/api/agent/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, language }),
      });
      const data = await res.json();
      const reply = data.reply || (language === "ur" ? "معذرت، جواب نہیں مل سکا۔" : "Sorry, I couldn't get a reply.");
      setAssistantMessages((m) => [...m, { id: `local-${Date.now()}-r`, role: "assistant", text: reply }]);
      speak(reply);
    } catch {
      const fallback = language === "ur" ? "رابطہ نہیں ہو سکا۔" : "Couldn't reach the assistant.";
      setAssistantMessages((m) => [...m, { id: `local-${Date.now()}-r`, role: "assistant", text: fallback }]);
    } finally {
      setAssistantBusy(false);
    }
  }

  function handleSend() {
    if (!text.trim()) return;
    sendToAssistant(text.trim());
    setText("");
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setAssistantMessages((m) => [
        ...m,
        {
          id: `local-${Date.now()}-e`,
          role: "assistant",
          text: language === "ur" ? "یہ براؤزر صوتی ان پٹ سپورٹ نہیں کرتا۔" : "This browser doesn't support voice input.",
        },
      ]);
      return;
    }
    const recognition = new SR();
    recognition.lang = language === "ur" ? "ur-PK" : "en-US";
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
    <section className="flex-1 flex flex-col min-w-0">
      <header className="border-b hairline px-5 py-3 bg-white font-medium flex items-center gap-2">
        <span>🤖</span>
        AIDEN Assistant
        <span className="text-xs font-normal text-ink/40 ml-2">
          {language === "ur" ? "(صرف متن اور آواز — یہ اصل چیٹ نہیں ہے)" : "(text + voice only — not a real conversation)"}
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {assistantMessages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] rounded-card px-3 py-2 text-sm ${m.role === "user" ? "bg-teal text-white" : "bg-marigold/20 border hairline"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {assistantBusy && (
          <p className="text-xs text-ink/40">
            AIDEN {language === "ur" ? "سوچ رہا ہے…" : "is thinking…"}
          </p>
        )}
      </div>

      <div className="border-t hairline bg-white px-5 py-3 flex items-center gap-2">
        <button
          onClick={listening ? stopListening : startListening}
          title={language === "ur" ? "بولیں" : "Speak"}
          className={`w-9 h-9 rounded-full ${listening ? "bg-red-500 text-white animate-pulse" : "bg-teal-light"}`}
        >
          🎙️
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("type_message")}
          className={`flex-1 border hairline rounded-card px-3 py-2 text-sm ${language === "ur" ? "font-urdu text-right" : ""}`}
        />
        <button onClick={handleSend} className="bg-marigold text-ink rounded-card px-4 py-2 font-medium text-sm">
          {t("send")}
        </button>
      </div>
    </section>
  );
}
