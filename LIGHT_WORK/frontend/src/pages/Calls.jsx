import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import { describeMediaError } from "../lib/mediaErrors";
import { searchUsers } from "../lib/api";

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
  const [status, setStatus] = useState("idle"); // idle | calling | ringing | in-call
  const [incoming, setIncoming] = useState(null);
  const [callType, setCallType] = useState("video");
  const [mediaError, setMediaError] = useState("");
  const [needsAudioTap, setNeedsAudioTap] = useState(false);

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
      await createOffer();
    });
    socket.on("call:reject", () => { setStatus("idle"); teardown(); });
    socket.on("call:end", () => { setStatus("idle"); teardown(); });
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
        try { await pc.addIceCandidate(signal); } catch {}
      }
    });
    return () => {
      socket.off("call:invite"); socket.off("call:accept"); socket.off("call:reject");
      socket.off("call:end"); socket.off("call:signal");
      // Same class of bug as camera/recording: if the user leaves this tab
      // mid-call (e.g. clicks Chat) without hanging up first, release the
      // stream and close the peer connection so the mic/camera aren't left
      // locked for every other page.
      pcRef.current?.close();
      pcRef.current = null;
      if (localVideoRef.current?.srcObject) localVideoRef.current.srcObject.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(q) {
    setQuery(q);
    if (!q.trim()) return setResults([]);
    const users = await searchUsers(q, token);
    setResults(users);
  }

  async function setupPeerConnection(type) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current.emit("call:signal", { toUserId: remoteUserRef.current, signal: e.candidate });
    };
    pc.ontrack = (e) => {
      if (!remoteVideoRef.current) return;
      remoteVideoRef.current.srcObject = e.streams[0];
      // Browsers often block autoplay of an unmuted <video>/<audio> element when the
      // srcObject is attached asynchronously (as it is here, from ontrack) rather than
      // directly inside a click handler — this was making calls connect with picture
      // but NO SOUND. Explicitly calling play() here, with a visible fallback if the
      // browser still refuses, fixes that instead of silently failing.
      remoteVideoRef.current.play().catch(() => setNeedsAudioTap(true));
    };
    const stream = await navigator.mediaDevices.getUserMedia({ video: type === "video", audio: true }).catch((err) => {
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
  }

  function rejectCall() {
    socketRef.current.emit("call:reject", { toUserId: incoming.fromUserId });
    setIncoming(null);
    setStatus("idle");
  }

  function teardown() {
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current?.srcObject) localVideoRef.current.srcObject.getTracks().forEach((tr) => tr.stop());
  }

  function hangUp() {
    socketRef.current.emit("call:end", { toUserId: remoteUserRef.current });
    teardown();
    setStatus("idle");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-4">{t("nav_calls")}</h1>
      {mediaError && (
        <p className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{mediaError}</p>
      )}

      {status === "idle" && (
        <>
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder={t("find_people")}
            className="w-full border hairline rounded-card px-3 py-2 mb-3"
          />
          <ul className="space-y-2">
            {results.map((u) => (
              <li key={u.id} className="flex items-center justify-between bg-white border hairline rounded-card px-4 py-3">
                <span className="font-medium">{u.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => callUser(u, "voice")} className="bg-teal-light text-teal-dark rounded-card px-3 py-1.5 text-sm">📞 {t("call_voice")}</button>
                  <button onClick={() => callUser(u, "video")} className="bg-marigold text-ink rounded-card px-3 py-1.5 text-sm">🎥 {t("call_video")}</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {status === "ringing" && incoming && (
        <div className="bg-white border hairline rounded-card p-6 text-center">
          <p className="mb-4">{t("incoming_call")}…</p>
          <div className="flex gap-3 justify-center">
            <button onClick={acceptCall} className="bg-teal text-white rounded-card px-5 py-2.5 font-medium">{t("accept")}</button>
            <button onClick={rejectCall} className="bg-rani text-white rounded-card px-5 py-2.5 font-medium">{t("decline")}</button>
          </div>
        </div>
      )}

      {status === "calling" && (
        <div className="bg-white border hairline rounded-card p-6 text-center">
          <p>Calling…</p>
          <button onClick={hangUp} className="mt-4 bg-rani text-white rounded-card px-5 py-2.5 font-medium">{t("hang_up")}</button>
        </div>
      )}

      {status === "in-call" && (
        <div>
          {needsAudioTap && (
            <button
              onClick={() => { remoteVideoRef.current?.play(); setNeedsAudioTap(false); }}
              className="w-full mb-3 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg"
            >
              🔊 Tap here to enable call audio (your browser blocked it from starting automatically)
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded-card bg-black aspect-video" />
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-card bg-black aspect-video" />
          </div>
          <button onClick={hangUp} className="mt-4 bg-rani text-white rounded-card px-5 py-2.5 font-medium">{t("hang_up")}</button>
        </div>
      )}
    </div>
  );
}
