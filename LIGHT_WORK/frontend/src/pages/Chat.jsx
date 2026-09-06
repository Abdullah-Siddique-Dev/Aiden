import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import { useCamera } from "../lib/useCamera";
import { useRecorder } from "../lib/useRecorder";
import { autoDetect, preloadDetectors } from "../lib/detectFromCamera";
import Calls from "./Calls";

const ASSISTANT_ID = "aiden-assistant"; // synthetic conversation id, never touches the messages/conversations tables

const DETECTION_BADGE = {
  sign: { en: "Sign", ur: "اشارہ", icon: "👋" },
  currency: { en: "Currency", ur: "کرنسی", icon: "💵" },
  text: { en: "Text", ur: "تحریر", icon: "📝" },
  object: { en: "Object", ur: "چیز", icon: "📦" },
};

export default function Chat() {
  const { t, language, speak } = useApp();
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [section, setSection] = useState("messages"); // "messages" | "calls"
  const socketRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const isAssistant = activeConv?.id === ASSISTANT_ID;
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const [detectOpen, setDetectOpen] = useState(false);
  const [detectStatus, setDetectStatus] = useState("");
  const [detectBusy, setDetectBusy] = useState(false);
  const detectCam = useCamera(language);

  const [recordMode, setRecordMode] = useState(null);
  const voiceRec = useRecorder("voice", language);
  const videoRec = useRecorder("video", language);
  const recordVideoPreviewRef = useRef(null);

  useEffect(() => {
    const socket = getSocket(token);
    socketRef.current = socket;
    socket.on("chat:message", (msg) => {
      setMessages((m) => (msg.conversation_id === activeConv?.id ? [...m, msg] : m));
      loadConversations();
    });
    socket.on("chat:typing", ({ userId, isTyping }) => {
      if (userId !== user.id) setTypingUser(isTyping ? userId : null);
    });
    loadConversations();
    preloadDetectors();
    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, assistantMessages]);

  useEffect(() => {
    if (recordVideoPreviewRef.current && videoRec.previewStream) {
      recordVideoPreviewRef.current.srcObject = videoRec.previewStream;
    }
  }, [videoRec.previewStream]);

  useEffect(() => {
    if (searchParams.get("assistant") === "1") openAssistant();
    if (searchParams.get("tab") === "calls") setSection("calls");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadConversations() {
    const res = await fetch("/api/chat/conversations", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function search(q) {
    setQuery(q);
    if (!q.trim()) return setResults([]);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setResults(data.users || []);
  }

  async function openConversationWith(otherUser) {
    const res = await fetch("/api/chat/conversations/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: otherUser.id }),
    });
    const data = await res.json();
    const conv = { id: data.conversationId, with: otherUser };
    setActiveConv(conv);
    setResults([]);
    setQuery("");
    socketRef.current.emit("chat:join", { conversationId: conv.id });
    const msgsRes = await fetch(`/api/chat/conversations/${conv.id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
    setMessages((await msgsRes.json()).messages || []);
    loadConversations();
  }

  function openExisting(conv) {
    setActiveConv(conv);
    socketRef.current.emit("chat:join", { conversationId: conv.id });
    fetch(`/api/chat/conversations/${conv.id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []));
  }

  function openAssistant() {
    setActiveConv({ id: ASSISTANT_ID, with: { name: "AIDEN Assistant", isAssistant: true } });
  }

  function sendText() {
    if (!text.trim() || !activeConv) return;
    if (isAssistant) {
      sendToAssistant(text.trim());
      setText("");
      return;
    }
    socketRef.current.emit("chat:message", { conversationId: activeConv.id, type: "text", content: text.trim() });
    setText("");
  }

  function onTyping(val) {
    setText(val);
    if (!activeConv || isAssistant) return;
    socketRef.current.emit("chat:typing", { conversationId: activeConv.id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current.emit("chat:typing", { conversationId: activeConv.id, isTyping: false });
    }, 1200);
  }

  async function uploadFile(file, type) {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    const res = await fetch("/api/chat/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const data = await res.json();
    socketRef.current.emit("chat:message", { conversationId: activeConv.id, type, content: data.url });
  }

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

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setAssistantMessages((m) => [
        ...m,
        { id: `local-${Date.now()}-e`, role: "assistant", text: language === "ur" ? "یہ براؤزر صوتی ان پٹ سپورٹ نہیں کرتا۔" : "This browser doesn't support voice input." },
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

  async function openDetectModal() {
    setDetectOpen(true);
    setDetectStatus("");
    await detectCam.start("environment");
  }

  function closeDetectModal() {
    detectCam.stop();
    setDetectOpen(false);
    setDetectStatus("");
  }

  async function runDetectAndSend() {
    if (!detectCam.active) return;
    setDetectBusy(true);
    setDetectStatus(language === "ur" ? "پہچانا جا رہا ہے…" : "Detecting…");
    try {
      const result = await autoDetect(detectCam.videoRef.current, language);
      if (!result) {
        setDetectStatus(language === "ur" ? "کچھ واضح نہیں ملا، دوبارہ کوشش کریں۔" : "Nothing confident detected — try again.");
        return;
      }
      const sendLabel = result.lowConfidence
        ? (language === "ur" ? `شاید: ${result.label}` : `Maybe: ${result.label}`)
        : result.label;
      const res = await fetch(`/api/chat/conversations/${activeConv.id}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: sendLabel, kind: result.kind, confidence: result.confidence }),
      });
      if (!res.ok) throw new Error("detect endpoint failed");
      speak(sendLabel); // read the detected sign/currency/object/text name aloud, not just show it
      setDetectStatus(language === "ur" ? "بھیج دیا گیا ✓" : "Sent ✓");
      setTimeout(closeDetectModal, 700);
    } catch {
      setDetectStatus(language === "ur" ? "بھیجنے میں مسئلہ ہوا" : "Something went wrong sending it");
    } finally {
      setDetectBusy(false);
    }
  }

  async function openRecorder(kind) {
    setRecordMode(kind);
    const rec = kind === "voice" ? voiceRec : videoRec;
    await rec.start();
  }

  async function stopAndSend() {
    const rec = recordMode === "voice" ? voiceRec : videoRec;
    const blob = await rec.stop();
    setRecordMode(null);
    if (!blob) return;
    const file = new File([blob], `${recordMode}-${Date.now()}.webm`, { type: blob.type });
    await uploadFile(file, recordMode);
  }

  function cancelRecording() {
    (recordMode === "voice" ? voiceRec : videoRec).cancel();
    setRecordMode(null);
  }

  const activeRecorder = recordMode === "voice" ? voiceRec : recordMode === "video" ? videoRec : null;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex border-b hairline bg-white shrink-0">
        <button
          onClick={() => setSection("messages")}
          className={`px-5 py-3 text-sm font-medium border-b-2 ${section === "messages" ? "border-teal text-teal" : "border-transparent text-ink/50"}`}
        >
          💬 {t("nav_chat")}
        </button>
        <button
          onClick={() => setSection("calls")}
          className={`px-5 py-3 text-sm font-medium border-b-2 ${section === "calls" ? "border-teal text-teal" : "border-transparent text-ink/50"}`}
        >
          📞 {t("nav_calls")}
        </button>
      </div>

      {section === "calls" ? (
        <div className="flex-1 overflow-y-auto">
          <Calls />
        </div>
      ) : (
      <div className="flex-1 flex min-h-0">
      <aside className="w-72 border-r hairline bg-white flex flex-col shrink-0">
        <div className="p-3 border-b hairline">
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder={t("find_people")}
            className="w-full border hairline rounded-card px-3 py-2 text-sm"
          />
          {results.length > 0 && (
            <ul className="mt-2 space-y-1">
              {results.map((u) => (
                <li key={u.id}>
                  <button onClick={() => openConversationWith(u)} className="w-full text-left px-2 py-1.5 rounded-card hover:bg-teal-light text-sm">
                    {u.name} <span className="text-ink/40">· {u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={openAssistant}
          className={`w-full text-left px-4 py-3 border-b-2 border-marigold/40 flex items-center gap-2 ${isAssistant ? "bg-marigold/20" : "bg-marigold/10 hover:bg-marigold/15"}`}
        >
          <span className="w-8 h-8 rounded-full bg-marigold flex items-center justify-center text-lg shrink-0">🤖</span>
          <span>
            <p className="font-semibold text-sm">AIDEN Assistant</p>
            <p className="text-xs text-ink/50">{language === "ur" ? "AI مددگار — الگ سے" : "AI helper — separate from real chat"}</p>
          </span>
        </button>

        <ul className="flex-1 overflow-y-auto">
          {conversations.length === 0 && <li className="p-4 text-sm text-ink/50">{t("no_conversations")}</li>}
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => openExisting(c)}
                className={`w-full text-left px-4 py-3 border-b hairline hover:bg-teal-light/40 ${activeConv?.id === c.id ? "bg-teal-light" : ""}`}
              >
                <p className="font-medium text-sm">{c.with?.name}</p>
                <p className="text-xs text-ink/50 truncate">
                  {c.lastMessage?.type === "detection"
                    ? `${DETECTION_BADGE[c.lastMessage.detection_kind]?.icon || ""} ${c.lastMessage.content}`
                    : c.lastMessage?.content || "…"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex-1 flex flex-col min-w-0">
        {activeConv ? (
          <>
            <header className="border-b hairline px-5 py-3 bg-white font-medium flex items-center gap-2">
              {isAssistant && <span>🤖</span>}
              {activeConv.with?.name}
              {isAssistant && (
                <span className="text-xs font-normal text-ink/40 ml-2">
                  {language === "ur" ? "(صرف متن اور آواز — یہ اصل چیٹ نہیں ہے)" : "(text + voice only — not a real conversation)"}
                </span>
              )}
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {!isAssistant && messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-card px-3 py-2 text-sm ${m.sender_id === user.id ? "bg-teal text-white" : "bg-white border hairline"}`}>
                    {m.type === "text" && m.content}
                    {m.type === "image" && <img src={m.content} alt="shared" className="rounded max-w-full" />}
                    {m.type === "voice" && <audio controls src={m.content} className="max-w-full" />}
                    {m.type === "video" && <video controls src={m.content} className="max-w-full rounded" />}
                    {m.type === "detection" && (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-marigold/30 mb-1">
                          {DETECTION_BADGE[m.detection_kind]?.icon} {language === "ur" ? DETECTION_BADGE[m.detection_kind]?.ur : DETECTION_BADGE[m.detection_kind]?.en}
                        </span>
                        <p className="font-medium">{m.content}</p>
                        {m.detection_confidence != null && (
                          <p className="text-xs opacity-60">{Math.round(m.detection_confidence * 100)}%</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAssistant && assistantMessages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-card px-3 py-2 text-sm ${m.role === "user" ? "bg-teal text-white" : "bg-marigold/20 border hairline"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isAssistant && assistantBusy && <p className="text-xs text-ink/40">AIDEN {language === "ur" ? "سوچ رہا ہے…" : "is thinking…"}</p>}
              {!isAssistant && typingUser && <p className="text-xs text-ink/40">{activeConv.with?.name} is typing…</p>}
            </div>

            {recordMode && (
              <div className="border-t hairline bg-ink text-white px-5 py-3 flex items-center gap-3">
                {recordMode === "video" && (
                  <video ref={recordVideoPreviewRef} autoPlay muted playsInline className="w-16 h-12 rounded object-cover bg-black" />
                )}
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono">
                  {String(Math.floor(activeRecorder.seconds / 60)).padStart(2, "0")}:{String(activeRecorder.seconds % 60).padStart(2, "0")}
                  {activeRecorder.maxSeconds ? ` / 01:00` : ""}
                </span>
                {activeRecorder.error && <span className="text-xs text-red-300">{activeRecorder.error}</span>}
                <div className="flex-1" />
                <button onClick={cancelRecording} className="text-sm px-3 py-1.5 rounded-card bg-white/10">
                  {language === "ur" ? "منسوخ" : "Cancel"}
                </button>
                <button onClick={stopAndSend} className="text-sm px-3 py-1.5 rounded-card bg-teal font-medium">
                  {language === "ur" ? "روکیں اور بھیجیں" : "Stop & Send"}
                </button>
              </div>
            )}

            <div className="border-t hairline bg-white px-5 py-3 flex items-center gap-2">
              {!isAssistant && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} title={language === "ur" ? "فائل بھیجیں" : "Attach file"} className="w-9 h-9 rounded-full bg-teal-light">📎</button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const type = f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "voice" : "image";
                      uploadFile(f, type);
                      e.target.value = "";
                    }}
                  />
                  <button onClick={() => openRecorder("voice")} title={language === "ur" ? "آواز ریکارڈ کریں" : "Record voice note"} className="w-9 h-9 rounded-full bg-teal-light">🎙️</button>
                  <button onClick={() => openRecorder("video")} title={language === "ur" ? "ویڈیو ریکارڈ کریں" : "Record video clip"} className="w-9 h-9 rounded-full bg-teal-light">🎥</button>
                  <button onClick={openDetectModal} title={language === "ur" ? "پہچانیں اور بھیجیں" : "Detect & Send"} className="w-9 h-9 rounded-full bg-marigold">🔍</button>
                </>
              )}
              {isAssistant && (
                <button
                  onClick={listening ? stopListening : startListening}
                  title={language === "ur" ? "بولیں" : "Speak"}
                  className={`w-9 h-9 rounded-full ${listening ? "bg-red-500 text-white animate-pulse" : "bg-teal-light"}`}
                >
                  🎙️
                </button>
              )}
              <input
                value={text}
                onChange={(e) => onTyping(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendText()}
                placeholder={t("type_message")}
                className={`flex-1 border hairline rounded-card px-3 py-2 text-sm ${language === "ur" ? "font-urdu text-right" : ""}`}
              />
              <button onClick={sendText} className="bg-marigold text-ink rounded-card px-4 py-2 font-medium text-sm">{t("send")}</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink/40">{t("no_conversations")}</div>
        )}
      </section>
      </div>
      )}

      {detectOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card p-4 max-w-md w-full">
            <h2 className="font-display text-lg font-semibold mb-2">
              {language === "ur" ? "پہچانیں اور بھیجیں" : "Detect & Send"}
            </h2>
            <p className="text-xs text-ink/50 mb-3">
              {language === "ur"
                ? "اشارہ، کرنسی نوٹ، یا تحریر کیمرے کے سامنے رکھیں۔"
                : "Show a sign, currency note, printed text, or object to the camera."}
            </p>
            <div className="relative bg-black rounded-card overflow-hidden aspect-video mb-3">
              <video ref={detectCam.videoRef} className="w-full h-full object-cover" playsInline muted />
              {!detectCam.active && (
                <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm text-center px-4">
                  {detectCam.error || (language === "ur" ? "کیمرہ شروع ہو رہا ہے…" : "Starting camera…")}
                </div>
              )}
            </div>
            {detectStatus && <p className="text-sm text-center mb-3">{detectStatus}</p>}
            <div className="flex gap-2">
              <button onClick={closeDetectModal} className="flex-1 border hairline rounded-card py-2.5">
                {language === "ur" ? "منسوخ" : "Cancel"}
              </button>
              <button
                disabled={!detectCam.active || detectBusy}
                onClick={runDetectAndSend}
                className="flex-1 bg-marigold text-ink rounded-card py-2.5 font-medium disabled:opacity-40"
              >
                {detectBusy ? (language === "ur" ? "پہچان رہے ہیں…" : "Detecting…") : (language === "ur" ? "پہچانیں" : "Detect")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
