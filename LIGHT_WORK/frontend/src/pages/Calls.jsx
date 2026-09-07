import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import { describeMediaError } from "../lib/mediaErrors";
import { searchUsers } from "../lib/api";
import { Button, Card, Badge } from "../components/ui";
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  ShieldCheck,
  Volume2,
  Radio,
  Check,
  X,
  AlertCircle,
  Search,
} from "lucide-react";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export default function Calls() {
  const { t, language } = useApp();
  const { token } = useAuth();
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteUserRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | calling | ringing | in-call | ended
  const [incoming, setIncoming] = useState(null);
  const [callType, setCallType] = useState("video");
  const [mediaError, setMediaError] = useState("");
  const [needsAudioTap, setNeedsAudioTap] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const callTimerRef = useRef(null);
  const isUrdu = language === "ur";

  useEffect(() => {
    const socket = getSocket(token);
    socketRef.current = socket;
    socket.on("call:invite", ({ fromUserId, callType: ct }) => {
      remoteUserRef.current = fromUserId;
      setCallType(ct);
      setIncoming({ fromUserId, callType: ct });
      setStatus("ringing");
    });
    socket.on("call:accept", async () => {
      setStatus("in-call");
      startTimer();
      await createOffer();
    });
    socket.on("call:reject", () => {
      handleCallEnd();
    });
    socket.on("call:end", () => {
      handleCallEnd();
    });
    socket.on("call:signal", async ({ signal }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (signal.type === "offer") {
        await pc.setRemoteDescription(signal);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:signal", { toUserId: remoteUserRef.current, signal: answer });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(signal);
      } else if (signal.candidate) {
        try {
          await pc.addIceCandidate(signal);
        } catch {}
      }
    });

    return () => {
      socket.off("call:invite");
      socket.off("call:accept");
      socket.off("call:reject");
      socket.off("call:end");
      socket.off("call:signal");
      clearInterval(callTimerRef.current);
      pcRef.current?.close();
      pcRef.current = null;
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach((tr) => tr.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTimer() {
    setCallDuration(0);
    clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }

  function handleCallEnd() {
    clearInterval(callTimerRef.current);
    setStatus("ended");
    teardown();
    setTimeout(() => {
      setStatus("idle");
    }, 2000);
  }

  async function search(q) {
    setQuery(q);
    if (!q.trim()) return setResults([]);
    const users = await searchUsers(q, token);
    setResults(users);
  }

  async function setupPeerConnection(type) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("call:signal", {
          toUserId: remoteUserRef.current,
          signal: e.candidate,
        });
      }
    };
    pc.ontrack = (e) => {
      if (!remoteVideoRef.current) return;
      remoteVideoRef.current.srcObject = e.streams[0];
      remoteVideoRef.current.play().catch(() => setNeedsAudioTap(true));
    };
    const stream = await navigator.mediaDevices
      .getUserMedia({ video: type === "video", audio: true })
      .catch((err) => {
        setMediaError(describeMediaError(err, language));
        setStatus("idle");
        throw err;
      });
    setMediaError("");
    stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    pcRef.current = pc;
    return pc;
  }

  async function createOffer() {
    const pc = await setupPeerConnection(callType);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("call:signal", { toUserId: remoteUserRef.current, signal: offer });
  }

  function callUser(otherUser, type) {
    remoteUserRef.current = otherUser.id;
    setCallType(type);
    setStatus("calling");
    socketRef.current.emit("call:invite", { toUserId: otherUser.id, callType: type });
  }

  async function acceptCall() {
    remoteUserRef.current = incoming.fromUserId;
    await setupPeerConnection(incoming.callType);
    socketRef.current.emit("call:accept", { toUserId: incoming.fromUserId });
    setIncoming(null);
    setStatus("in-call");
    startTimer();
  }

  function rejectCall() {
    socketRef.current.emit("call:reject", { toUserId: incoming.fromUserId });
    setIncoming(null);
    setStatus("idle");
  }

  function teardown() {
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((tr) => tr.stop());
    }
  }

  function hangUp() {
    socketRef.current.emit("call:end", { toUserId: remoteUserRef.current });
    handleCallEnd();
  }

  function toggleMic() {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  }

  function toggleCamera() {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOff(!videoTrack.enabled);
      }
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-2xl sm:text-3xl font-bold text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
              {t("nav_calls")}
            </h1>
            <Badge variant="primary" size="sm">
              WebRTC Audio & Video
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-aiden-text-secondary mt-0.5">
            {isUrdu
              ? "دوسرے صارفین کے ساتھ براہِ راست ہم وقت آواز اور ویڈیو رابطہ"
              : "Peer-to-peer encrypted real-time communications for signers and speakers"}
          </p>
        </div>
      </div>

      {mediaError && (
        <div className="p-4 rounded-aiden-md bg-aiden-danger-light border border-aiden-danger/25 text-aiden-danger text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-aiden-danger shrink-0 mt-0.5" />
          <span>{mediaError}</span>
        </div>
      )}

      {status === "idle" && (
        <div className="space-y-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-aiden-text-muted pointer-events-none" />
            <input
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder={t("find_people")}
              className={`w-full bg-aiden-surface text-aiden-text-primary text-xs sm:text-sm rounded-aiden-md border border-aiden-border py-2.5 pl-9 pr-3.5 focus:border-aiden-primary focus:ring-2 focus:ring-aiden-primary/20 outline-none transition-all shadow-subtle ${
                isUrdu ? "font-urdu text-right" : ""
              }`}
            />
          </div>

          <ul className="space-y-2.5">
            {results.length === 0 && query && (
              <li className="p-6 text-center text-xs sm:text-sm text-aiden-text-muted bg-aiden-surface rounded-aiden-lg border border-aiden-border">
                {isUrdu ? "کوئی صارف نہیں ملا" : "No users found matching your search"}
              </li>
            )}
            {results.map((u) => (
              <li key={u.id}>
                <Card
                  variant="interactive"
                  padding="sm"
                  className="flex items-center justify-between hover:border-aiden-primary/40"
                >
                  <div className="flex items-center gap-3 pl-2">
                    <span className="w-10 h-10 rounded-full bg-aiden-primary-light text-aiden-primary font-bold flex items-center justify-center text-sm shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-aiden-text-primary block">
                        {u.name}
                      </span>
                      <span className="text-xs text-aiden-text-muted block">{u.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => callUser(u, "voice")}
                      icon={<Phone className="w-4 h-4" />}
                      className="font-semibold"
                    >
                      {t("call_voice")}
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => callUser(u, "video")}
                      icon={<Video className="w-4 h-4" />}
                      className="font-bold shadow-sm"
                    >
                      {t("call_video")}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ringing Modal Card */}
      {status === "ringing" && incoming && (
        <Card variant="ai" padding="lg" className="text-center shadow-card max-w-md mx-auto space-y-4 animate-fade-in">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-aiden-accent/40 animate-aiden-radar" />
            <div className="w-16 h-16 rounded-full bg-aiden-accent text-aiden-text-primary flex items-center justify-center relative z-10 shadow-card">
              <Phone className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <h2 className="font-display text-xl font-bold text-aiden-text-primary">
            {t("incoming_call")}
          </h2>
          <p className="text-sm text-aiden-text-secondary">
            {isUrdu ? "آپ کو ایک نئی کال موصول ہو رہی ہے…" : `Incoming ${incoming.callType} call…`}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={acceptCall}
              icon={<Check className="w-4 h-4" />}
              className="px-6 font-bold shadow-sm"
            >
              {t("accept")}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={rejectCall}
              icon={<X className="w-4 h-4" />}
              className="px-6 font-bold shadow-sm"
            >
              {t("decline")}
            </Button>
          </div>
        </Card>
      )}

      {/* Calling (Radar) State Card */}
      {status === "calling" && (
        <Card variant="standard" padding="lg" className="text-center shadow-card max-w-md mx-auto space-y-4 animate-fade-in">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-aiden-primary/30 animate-aiden-radar" />
            <div className="w-16 h-16 rounded-full bg-aiden-primary text-white flex items-center justify-center relative z-10 shadow-card">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <h2 className="font-display text-lg font-bold text-aiden-text-primary">
            {isUrdu ? "کال ملائی جا رہی ہے…" : "Connecting Peer-to-Peer Call…"}
          </h2>
          <p className="text-xs text-aiden-text-muted">
            {isUrdu ? "دوسرے صارف کے جواب کا انتظار کریں" : "Waiting for partner to accept…"}
          </p>
          <div className="pt-2">
            <Button
              variant="danger"
              size="md"
              onClick={hangUp}
              icon={<PhoneOff className="w-4 h-4" />}
              className="font-bold shadow-sm px-6"
            >
              {t("hang_up")}
            </Button>
          </div>
        </Card>
      )}

      {/* In-Call Active Stage */}
      {status === "in-call" && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Bar with timer & security */}
          <div className="p-3.5 rounded-aiden-md bg-aiden-surface border border-aiden-border flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-aiden-success animate-ping" />
              <span className="text-xs font-bold text-aiden-text-primary uppercase tracking-wider">
                Call Active
              </span>
              <span className="font-mono text-sm font-bold text-aiden-primary ml-2">
                {formatTime(callDuration)}
              </span>
            </div>
            <Badge variant="accent" size="sm" className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Encrypted P2P</span>
            </Badge>
          </div>

          {needsAudioTap && (
            <button
              onClick={() => {
                remoteVideoRef.current?.play();
                setNeedsAudioTap(false);
              }}
              className="w-full p-3.5 rounded-aiden-md bg-aiden-accent-light border border-aiden-accent/40 text-aiden-text-primary text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <Volume2 className="w-4 h-4 text-aiden-primary" />
              <span>{isUrdu ? "آواز سننے کے لیے یہاں ٹیپ کریں" : "Tap here to enable audio stream"}</span>
            </button>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative rounded-aiden-lg overflow-hidden bg-black aspect-video border border-aiden-border shadow-card">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
                {isUrdu ? "آپ" : "You (Local)"}
              </span>
              {micMuted && (
                <span className="absolute top-2 right-2 bg-aiden-danger text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  Muted
                </span>
              )}
            </div>

            <div className="relative rounded-aiden-lg overflow-hidden bg-black aspect-video border border-aiden-border shadow-card">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
                {isUrdu ? "ساتھی" : "Partner (Remote)"}
              </span>
            </div>
          </div>

          {/* Call Controls Toolbar */}
          <div className="p-4 rounded-aiden-xl bg-aiden-surface border border-aiden-border shadow-subtle flex items-center justify-center gap-3">
            <Button
              variant={micMuted ? "danger" : "secondary"}
              size="md"
              onClick={toggleMic}
              icon={micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              className="font-semibold"
            >
              {micMuted ? "Unmute" : "Mute"}
            </Button>

            <Button
              variant={cameraOff ? "danger" : "secondary"}
              size="md"
              onClick={toggleCamera}
              icon={cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              className="font-semibold"
            >
              {cameraOff ? "Camera On" : "Camera Off"}
            </Button>

            <Button
              variant="danger"
              size="md"
              onClick={hangUp}
              icon={<PhoneOff className="w-4 h-4" />}
              className="font-bold shadow-card px-7"
            >
              {t("hang_up")}
            </Button>
          </div>
        </div>
      )}

      {/* Call Ended Temporary Card */}
      {status === "ended" && (
        <Card variant="subtle" padding="lg" className="text-center shadow-subtle max-w-sm mx-auto animate-fade-in">
          <PhoneOff className="w-8 h-8 text-aiden-text-muted mx-auto mb-2" />
          <h3 className="font-display text-base font-bold text-aiden-text-primary mb-1">
            {isUrdu ? "کال ختم ہو گئی" : "Call Ended"}
          </h3>
          <p className="text-xs text-aiden-text-muted">Returning to directory…</p>
        </Card>
      )}
    </div>
  );
}
