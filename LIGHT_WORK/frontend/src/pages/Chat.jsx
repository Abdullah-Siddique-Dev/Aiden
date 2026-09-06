import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import { useRecorder } from "../lib/useRecorder";
import { preloadDetectors } from "../lib/detectFromCamera";
import { searchUsers } from "../lib/api";
import Calls from "./Calls";
import ChatDetectModal from "../components/ChatDetectModal";
import ChatRecordBar from "../components/ChatRecordBar";
import AidenAssistantChat from "../components/AidenAssistantChat";

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

  const [detectOpen, setDetectOpen] = useState(false);

  const [recordMode, setRecordMode] = useState(null);
  const voiceRec = useRecorder("voice", language);
  const videoRec = useRecorder("video", language);

  useEffect(() => {
    const socket = getSocket(token);
    socketRef.current = socket;
    const handleMessage = (msg) => {
      setMessages((m) => (msg.conversation_id === activeConv?.id ? [...m, msg] : m));
      loadConversations();
    };
    const handleTyping = ({ userId, isTyping }) => {
      if (userId !== user.id) setTypingUser(isTyping ? userId : null);
    };
    socket.on("chat:message", handleMessage);
    socket.on("chat:typing", handleTyping);
    loadConversations();
    preloadDetectors();
    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:typing", handleTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.id]);


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
    const users = await searchUsers(q, token);
    setResults(users);
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

      {isAssistant ? (
        <AidenAssistantChat
          token={token}
          language={language}
          speak={speak}
          t={t}
        />
      ) : (
        <section className="flex-1 flex flex-col min-w-0">
          {activeConv ? (
            <>
              <header className="border-b hairline px-5 py-3 bg-white font-medium flex items-center gap-2">
                {activeConv.with?.name}
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {messages.map((m) => (
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
                {typingUser && <p className="text-xs text-ink/40">{activeConv.with?.name} is typing…</p>}
              </div>

              <ChatRecordBar
                mode={recordMode}
                recorder={activeRecorder}
                previewStream={videoRec.previewStream}
                language={language}
                onCancel={cancelRecording}
                onStop={stopAndSend}
              />

              <div className="border-t hairline bg-white px-5 py-3 flex items-center gap-2">
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
                <button onClick={() => setDetectOpen(true)} title={language === "ur" ? "پہچانیں اور بھیجیں" : "Detect & Send"} className="w-9 h-9 rounded-full bg-marigold">🔍</button>
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
      )}
      </div>
      )}

      <ChatDetectModal
        isOpen={detectOpen}
        onClose={() => setDetectOpen(false)}
        conversationId={activeConv?.id}
        token={token}
        language={language}
        speak={speak}
      />
    </div>
  );
}
