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
import { Button, Badge, Tabs } from "../components/ui";
import {
  Bot,
  MessageSquare,
  Phone,
  Video,
  Paperclip,
  Mic,
  Search,
  Send,
  Hand,
  Banknote,
  FileText,
  Box,
} from "lucide-react";

const ASSISTANT_ID = "aiden-assistant";

const DETECTION_BADGE = {
  sign: { en: "Sign", ur: "اشارہ", icon: Hand },
  currency: { en: "Currency", ur: "کرنسی", icon: Banknote },
  text: { en: "Text", ur: "تحریر", icon: FileText },
  object: { en: "Object", ur: "چیز", icon: Box },
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
  const isUrdu = language === "ur";

  const isAssistant = activeConv?.id === ASSISTANT_ID;
  const [detectOpen, setDetectOpen] = useState(false);

  const [recordMode, setRecordMode] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);

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
  }, [messages, typingUser]);

  useEffect(() => {
    if (searchParams.get("assistant") === "1") openAssistant();
    if (searchParams.get("tab") === "calls") setSection("calls");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadConversations() {
    const res = await fetch("/api/chat/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    const msgsRes = await fetch(`/api/chat/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages((await msgsRes.json()).messages || []);
    loadConversations();
  }

  function openExisting(conv) {
    setActiveConv(conv);
    socketRef.current.emit("chat:join", { conversationId: conv.id });
    fetch(`/api/chat/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []));
  }

  function openAssistant() {
    setActiveConv({ id: ASSISTANT_ID, with: { name: "AIDEN Assistant", isAssistant: true } });
  }

  function sendText() {
    if (!text.trim() || !activeConv) return;
    socketRef.current.emit("chat:message", {
      conversationId: activeConv.id,
      type: "text",
      content: text.trim(),
    });
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
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      socketRef.current.emit("chat:message", {
        conversationId: activeConv.id,
        type,
        content: data.url,
      });
    } finally {
      setUploading(false);
      setPendingAttachment(null);
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

  const activeRecorder =
    recordMode === "voice" ? voiceRec : recordMode === "video" ? videoRec : null;

  const chatTabs = [
    { id: "messages", label: t("nav_chat"), icon: <MessageSquare className="w-4 h-4" /> },
    { id: "calls", label: t("nav_calls"), icon: <Phone className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-aiden-bg">
      {/* Tab bar switching between Chat & Calls */}
      <Tabs
        tabs={chatTabs}
        activeTab={section}
        onChange={setSection}
        variant="underline"
        className="px-4 shadow-subtle shrink-0"
      />

      {section === "calls" ? (
        <div className="flex-1 overflow-y-auto">
          <Calls />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar: Conversations & Search */}
          <aside className="w-72 sm:w-80 border-r border-aiden-border bg-aiden-surface flex flex-col shrink-0">
            {/* Search People Input */}
            <div className="p-3 border-b border-aiden-border-subtle">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-aiden-text-muted pointer-events-none" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => search(e.target.value)}
                  placeholder={t("find_people")}
                  className={`w-full bg-aiden-surface-secondary text-aiden-text-primary text-xs sm:text-sm rounded-aiden-md border border-aiden-border py-2 pl-8 pr-3 focus:border-aiden-primary focus:ring-2 focus:ring-aiden-primary/20 outline-none transition-all ${
                    isUrdu ? "font-urdu text-right" : ""
                  }`}
                />
              </div>
              {results.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {results.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => openConversationWith(u)}
                        className="w-full text-left px-2.5 py-2 rounded-aiden-md hover:bg-aiden-primary-light text-xs sm:text-sm flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-aiden-text-primary">{u.name}</span>
                        <span className="text-[11px] text-aiden-text-muted truncate ml-2">
                          {u.email}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* AIDEN Assistant Quick Conversation Button */}
            <button
              onClick={openAssistant}
              className={`w-full text-left px-4 py-3 border-b border-aiden-accent/30 flex items-center gap-3 transition-colors ${
                isAssistant
                  ? "bg-aiden-accent-light/70 font-semibold"
                  : "bg-gradient-to-r from-aiden-primary-subtle/70 to-aiden-accent-subtle/50 hover:bg-aiden-accent-light/40"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-aiden-accent text-aiden-text-primary flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs sm:text-sm text-aiden-text-primary">
                    AIDEN Assistant
                  </p>
                  <span className="w-2 h-2 rounded-full bg-aiden-accent animate-pulse" />
                </div>
                <p className="text-[11px] text-aiden-text-secondary truncate">
                  {isUrdu ? "AI مددگار — الگ اور محفوظ" : "AI helper — direct assistance"}
                </p>
              </div>
            </button>

            {/* Conversations List */}
            <ul className="flex-1 overflow-y-auto divide-y divide-aiden-border-subtle">
              {conversations.length === 0 && (
                <li className="p-6 text-center text-xs sm:text-sm text-aiden-text-muted">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-aiden-text-muted/60" />
                  {t("no_conversations")}
                </li>
              )}
              {conversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                const initials = c.with?.name?.charAt(0)?.toUpperCase() || "U";
                const BadgeIcon = DETECTION_BADGE[c.lastMessage?.detection_kind]?.icon;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => openExisting(c)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                        isSelected
                          ? "bg-aiden-primary-light text-aiden-primary font-medium border-l-4 border-aiden-primary shadow-subtle"
                          : "hover:bg-aiden-surface-secondary text-aiden-text-primary"
                      }`}
                    >
                      <span className="w-9 h-9 rounded-full bg-aiden-surface-secondary text-aiden-text-secondary font-bold flex items-center justify-center text-xs shrink-0 border border-aiden-border">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs sm:text-sm truncate ${
                            isSelected
                              ? "font-bold text-aiden-primary"
                              : "font-semibold text-aiden-text-primary"
                          }`}
                        >
                          {c.with?.name}
                        </p>
                        <p className="text-[11px] text-aiden-text-muted truncate mt-0.5 flex items-center gap-1">
                          {c.lastMessage?.type === "detection" && BadgeIcon ? (
                            <>
                              <BadgeIcon className="w-3 h-3 text-aiden-accent shrink-0" />
                              <span className="truncate">{c.lastMessage.content}</span>
                            </>
                          ) : (
                            c.lastMessage?.content || "…"
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Right Main Chat Area */}
          {isAssistant ? (
            <AidenAssistantChat
              token={token}
              language={language}
              speak={speak}
              t={t}
            />
          ) : (
            <section className="flex-1 flex flex-col min-w-0 bg-aiden-bg h-full">
              {activeConv ? (
                <>
                  {/* Conversation Header */}
                  <header className="border-b border-aiden-border px-5 py-3 bg-aiden-surface flex items-center justify-between shadow-subtle shrink-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-aiden-primary-light text-aiden-primary font-bold flex items-center justify-center text-xs shadow-sm">
                        {activeConv.with?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                      <div>
                        <h2 className="font-bold text-sm text-aiden-text-primary">
                          {activeConv.with?.name}
                        </h2>
                        <span className="flex items-center gap-1.5 text-[11px] text-aiden-success font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-aiden-success animate-pulse" />
                          Online
                        </span>
                      </div>
                    </div>

                    {/* Direct Call Triggers */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSection("calls")}
                        icon={<Phone className="w-4 h-4" />}
                        title="Voice Call"
                        className="text-xs"
                      >
                        Call
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSection("calls")}
                        icon={<Video className="w-4 h-4" />}
                        title="Video Call"
                        className="text-xs font-semibold"
                      >
                        Video
                      </Button>
                    </div>
                  </header>

                  {/* Messages Feed */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-aiden-text-muted">
                        <MessageSquare className="w-12 h-12 mb-3 text-aiden-text-muted/60 mx-auto" />
                        <h3 className="font-bold text-sm text-aiden-text-primary mb-1">
                          {isUrdu ? "گفتگو شروع کریں" : "Say Hello!"}
                        </h3>
                        <p className="text-xs sm:text-sm max-w-xs">
                          {isUrdu
                            ? "کوئی پیغام، آڈیو نوٹ یا آبجیکٹ ڈیٹیکشن بھیجیں"
                            : "Send text, voice notes, video clips, or live vision detections"}
                        </p>
                      </div>
                    )}

                    {messages.map((m) => {
                      const isMe = m.sender_id === user.id;
                      const BadgeIcon = DETECTION_BADGE[m.detection_kind]?.icon;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-subtle ${
                              isMe
                                ? "bg-aiden-primary text-white rounded-aiden-lg rounded-br-sm"
                                : "bg-aiden-surface border border-aiden-border text-aiden-text-primary rounded-aiden-lg rounded-bl-sm"
                            }`}
                          >
                            {m.type === "text" && (
                              <p className={`whitespace-pre-wrap ${isUrdu ? "font-urdu text-base" : ""}`}>
                                {m.content}
                              </p>
                            )}

                            {m.type === "image" && (
                              <img
                                src={m.content}
                                alt="shared attachment"
                                className="rounded-aiden-md max-w-full object-cover max-h-72 border border-black/10"
                              />
                            )}

                            {m.type === "voice" && (
                              <div className="py-1">
                                <audio controls src={m.content} className="max-w-full" />
                              </div>
                            )}

                            {m.type === "video" && (
                              <div className="py-1">
                                <video
                                  controls
                                  src={m.content}
                                  className="max-w-full rounded-aiden-md max-h-72 bg-black"
                                />
                              </div>
                            )}

                            {m.type === "detection" && (
                              <div className="space-y-1.5 py-0.5">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="accent" size="sm" className="inline-flex items-center gap-1">
                                    {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
                                    <span>
                                      {isUrdu
                                        ? DETECTION_BADGE[m.detection_kind]?.ur
                                        : DETECTION_BADGE[m.detection_kind]?.en}
                                    </span>
                                  </Badge>
                                  {m.detection_confidence != null && (
                                    <span className="text-[11px] opacity-80 font-mono font-bold">
                                      {Math.round(m.detection_confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                                <p className={`font-bold text-sm sm:text-base ${isUrdu ? "font-urdu" : ""}`}>
                                  {m.content}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {typingUser && (
                      <div className="flex items-center gap-2 text-xs text-aiden-text-muted italic py-1 animate-fade-in">
                        <span className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-aiden-primary animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-aiden-primary animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-aiden-primary animate-bounce [animation-delay:0.4s]" />
                        </span>
                        <span>{activeConv.with?.name} is typing…</span>
                      </div>
                    )}
                  </div>

                  {/* Attachment Preview Banner */}
                  {pendingAttachment && (
                    <div className="border-t border-aiden-accent/40 bg-aiden-accent-light/50 px-4 py-2 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-4 h-4 text-aiden-accent shrink-0" />
                        <span className="text-xs font-semibold text-aiden-text-primary truncate">
                          {pendingAttachment.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={uploading}
                          onClick={() => setPendingAttachment(null)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={uploading}
                          onClick={() =>
                            uploadFile(pendingAttachment.file, pendingAttachment.type)
                          }
                          className="text-xs font-bold shadow-sm"
                        >
                          Send File
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Audio/Video Recorder Strip */}
                  <ChatRecordBar
                    mode={recordMode}
                    recorder={activeRecorder}
                    previewStream={videoRec.previewStream}
                    language={language}
                    onCancel={cancelRecording}
                    onStop={stopAndSend}
                    processing={uploading}
                  />

                  {/* Input Toolbar */}
                  <div className="border-t border-aiden-border bg-aiden-surface px-4 sm:px-5 py-3 flex items-center gap-2 shrink-0 shadow-subtle">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<Paperclip className="w-4 h-4" />}
                      title={isUrdu ? "فائل یا تصویر بھیجیں" : "Attach file or photo"}
                      className="text-aiden-text-secondary hover:text-aiden-primary hover:bg-aiden-primary-light shrink-0"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept="image/*,video/*,audio/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const type = f.type.startsWith("video")
                          ? "video"
                          : f.type.startsWith("audio")
                          ? "voice"
                          : "image";
                        setPendingAttachment({
                          file: f,
                          type,
                          name: f.name,
                        });
                        e.target.value = "";
                      }}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openRecorder("voice")}
                      icon={<Mic className="w-4 h-4" />}
                      title={isUrdu ? "آواز ریکارڈ کریں" : "Record voice note"}
                      className="text-aiden-text-secondary hover:text-aiden-primary hover:bg-aiden-primary-light shrink-0"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openRecorder("video")}
                      icon={<Video className="w-4 h-4" />}
                      title={isUrdu ? "ویڈیو ریکارڈ کریں" : "Record video clip"}
                      className="text-aiden-text-secondary hover:text-aiden-primary hover:bg-aiden-primary-light shrink-0"
                    />

                    <Button
                      variant="accent"
                      size="icon"
                      onClick={() => setDetectOpen(true)}
                      icon={<Search className="w-4 h-4" />}
                      title={isUrdu ? "پہچانیں اور بھیجیں" : "Detect & Send"}
                      className="shrink-0 font-bold shadow-sm"
                    />

                    <input
                      value={text}
                      onChange={(e) => onTyping(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendText()}
                      placeholder={t("type_message")}
                      className={`flex-1 bg-aiden-surface-secondary text-aiden-text-primary text-xs sm:text-sm rounded-aiden-lg border border-aiden-border/80 py-2.5 px-3.5 shadow-subtle focus:border-aiden-primary focus:ring-2 focus:ring-aiden-primary/25 outline-none transition-all ${
                        isUrdu ? "font-urdu text-right text-base" : ""
                      }`}
                    />

                    <Button
                      variant="primary"
                      size="md"
                      onClick={sendText}
                      disabled={!text.trim()}
                      icon={<Send className="w-4 h-4" />}
                      className="shrink-0 font-bold shadow-sm"
                    >
                      {t("send")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-aiden-text-muted p-8 text-center">
                  <MessageSquare className="w-14 h-14 text-aiden-text-muted/60 mb-3" />
                  <h3 className="font-display text-lg font-bold text-aiden-text-primary mb-1">
                    {isUrdu ? "کوئی گفتگو منتخب نہیں ہے" : "No Conversation Selected"}
                  </h3>
                  <p className="text-xs sm:text-sm max-w-sm">
                    {t("no_conversations")}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Detect & Send Camera Modal */}
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
