import { useEffect, useState } from "react";
import { useCamera } from "../lib/useCamera";
import { autoDetect } from "../lib/detectFromCamera";

export default function ChatDetectModal({
  isOpen,
  onClose,
  conversationId,
  token,
  language,
  speak,
}) {
  const [detectStatus, setDetectStatus] = useState("");
  const [detectBusy, setDetectBusy] = useState(false);
  const detectCam = useCamera(language);

  useEffect(() => {
    if (isOpen) {
      setDetectStatus("");
      detectCam.start("environment");
    } else {
      detectCam.stop();
      setDetectStatus("");
    }
    return () => {
      detectCam.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function closeDetectModal() {
    detectCam.stop();
    setDetectStatus("");
    onClose?.();
  }

  async function runDetectAndSend() {
    if (!detectCam.active || !conversationId) return;
    setDetectBusy(true);
    setDetectStatus(language === "ur" ? "پہچانا جا رہا ہے…" : "Detecting…");
    try {
      const result = await autoDetect(detectCam.videoRef.current, language);
      if (!result) {
        setDetectStatus(
          language === "ur"
            ? "کچھ واضح نہیں ملا، دوبارہ کوشش کریں۔"
            : "Nothing confident detected — try again."
        );
        return;
      }
      const sendLabel = result.lowConfidence
        ? language === "ur"
          ? `شاید: ${result.label}`
          : `Maybe: ${result.label}`
        : result.label;
      const res = await fetch(`/api/chat/conversations/${conversationId}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: sendLabel, kind: result.kind, confidence: result.confidence }),
      });
      if (!res.ok) throw new Error("detect endpoint failed");
      speak(sendLabel); // read the detected sign/currency/object/text name aloud, not just show it
      setDetectStatus(language === "ur" ? "بھیج دیا گیا ✓" : "Sent ✓");
      setTimeout(closeDetectModal, 700);
    } catch {
      setDetectStatus(
        language === "ur" ? "بھیجنے میں مسئلہ ہوا" : "Something went wrong sending it"
      );
    } finally {
      setDetectBusy(false);
    }
  }

  if (!isOpen) return null;

  return (
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
  );
}
