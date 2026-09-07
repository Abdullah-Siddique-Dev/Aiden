import { useEffect, useRef } from "react";
import { Button } from "./ui";

export default function ChatRecordBar({
  mode,
  recorder,
  previewStream,
  language,
  onCancel,
  onStop,
  processing = false,
}) {
  const videoRef = useRef(null);
  const isUrdu = language === "ur";

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  if (!mode || !recorder) return null;

  return (
    <div className="border-t border-aiden-border bg-aiden-text-primary text-white px-4 sm:px-5 py-3 flex items-center gap-3 shadow-modal select-none animate-fade-in">
      {mode === "video" && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-16 h-12 rounded-aiden-sm object-cover bg-black border border-white/20 shrink-0"
        />
      )}

      {/* State sequence: Ready -> Recording -> Processing -> Sent */}
      <div className="flex items-center gap-2">
        {processing ? (
          <span className="flex items-center gap-2 text-xs font-semibold text-aiden-accent">
            <span className="w-3 h-3 rounded-full border-2 border-aiden-accent border-t-transparent animate-spin" />
            <span>{isUrdu ? "فائل پراسیس ہو رہی ہے…" : "Processing audio…"}</span>
          </span>
        ) : (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aiden-danger opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-aiden-danger" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-aiden-danger">
              {mode === "video" ? (isUrdu ? "ویڈیو ریکارڈنگ" : "Recording Video") : (isUrdu ? "آواز ریکارڈنگ" : "Recording Audio")}
            </span>
          </>
        )}
      </div>

      {!processing && (
        <span className="text-sm font-mono font-bold text-white/95">
          {String(Math.floor(recorder.seconds / 60)).padStart(2, "0")}:
          {String(recorder.seconds % 60).padStart(2, "0")}
          {recorder.maxSeconds ? ` / 01:00` : ""}
        </span>
      )}

      {recorder.error && (
        <span className="text-xs text-aiden-danger-light bg-aiden-danger/30 px-2 py-0.5 rounded">
          {recorder.error}
        </span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={processing}
          onClick={onCancel}
          className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
        >
          {isUrdu ? "منسوخ" : "Cancel"}
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={processing}
          onClick={onStop}
          className="font-bold shadow-sm text-xs"
        >
          {isUrdu ? "بھیجیں" : "Stop & Send"}
        </Button>
      </div>
    </div>
  );
}
