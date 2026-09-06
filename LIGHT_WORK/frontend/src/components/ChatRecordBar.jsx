import { useEffect, useRef } from "react";

export default function ChatRecordBar({
  mode,
  recorder,
  previewStream,
  language,
  onCancel,
  onStop,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  if (!mode || !recorder) return null;

  return (
    <div className="border-t hairline bg-ink text-white px-5 py-3 flex items-center gap-3">
      {mode === "video" && (
        <video ref={videoRef} autoPlay muted playsInline className="w-16 h-12 rounded object-cover bg-black" />
      )}
      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-sm font-mono">
        {String(Math.floor(recorder.seconds / 60)).padStart(2, "0")}:{String(recorder.seconds % 60).padStart(2, "0")}
        {recorder.maxSeconds ? ` / 01:00` : ""}
      </span>
      {recorder.error && <span className="text-xs text-red-300">{recorder.error}</span>}
      <div className="flex-1" />
      <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded-card bg-white/10">
        {language === "ur" ? "منسوخ" : "Cancel"}
      </button>
      <button onClick={onStop} className="text-sm px-3 py-1.5 rounded-card bg-teal font-medium">
        {language === "ur" ? "روکیں اور بھیجیں" : "Stop & Send"}
      </button>
    </div>
  );
}
