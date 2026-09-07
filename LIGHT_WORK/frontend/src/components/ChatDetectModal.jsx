import { useEffect, useState } from "react";
import { useCamera } from "../lib/useCamera";
import { autoDetect } from "../lib/detectFromCamera";
import { Modal, Button, Card } from "./ui";
import { Camera, Check } from "lucide-react";

export default function ChatDetectModal({
  isOpen,
  onClose,
  conversationId,
  token,
  language,
  speak,
}) {
  const [detectStatus, setDetectStatus] = useState("");
  const [detectSuccess, setDetectSuccess] = useState(false);
  const [detectBusy, setDetectBusy] = useState(false);
  const detectCam = useCamera(language);
  const isUrdu = language === "ur";

  useEffect(() => {
    if (isOpen) {
      setDetectStatus("");
      setDetectSuccess(false);
      detectCam.start("environment");
    } else {
      detectCam.stop();
      setDetectStatus("");
      setDetectSuccess(false);
    }
    return () => {
      detectCam.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function closeDetectModal() {
    detectCam.stop();
    setDetectStatus("");
    setDetectSuccess(false);
    onClose?.();
  }

  async function runDetectAndSend() {
    if (!detectCam.active || !conversationId) return;
    setDetectBusy(true);
    setDetectStatus(isUrdu ? "پہچانا جا رہا ہے…" : "Detecting surroundings…");
    try {
      const result = await autoDetect(detectCam.videoRef.current, language);
      if (!result) {
        setDetectStatus(
          isUrdu
            ? "کچھ واضح نہیں ملا، دوبارہ کوشش کریں۔"
            : "Nothing confident detected — please try again."
        );
        return;
      }
      const sendLabel = result.lowConfidence
        ? isUrdu
          ? `شاید: ${result.label}`
          : `Maybe: ${result.label}`
        : result.label;
      const res = await fetch(`/api/chat/conversations/${conversationId}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: sendLabel, kind: result.kind, confidence: result.confidence }),
      });
      if (!res.ok) throw new Error("detect endpoint failed");
      speak(sendLabel);
      setDetectSuccess(true);
      setDetectStatus(isUrdu ? "کامیابی سے بھیج دیا گیا" : "Detected & Sent");
      setTimeout(closeDetectModal, 750);
    } catch {
      setDetectStatus(
        isUrdu ? "بھیجنے میں مسئلہ ہوا" : "Something went wrong sending it"
      );
    } finally {
      setDetectBusy(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDetectModal}
      title={isUrdu ? "پہچانیں اور بھیجیں" : "Detect & Send"}
      description={
        isUrdu
          ? "کوئی اشارہ، نوٹ، کتاب، یا چیز کیمرے کو دکھائیں تاکہ خود بخود پہنچ جائے"
          : "Point your camera at a sign, currency note, text, or object to detect and send."
      }
      maxWidth="md"
      footer={
        <div className="flex gap-2.5 w-full">
          <Button
            variant="ghost"
            size="md"
            onClick={closeDetectModal}
            className="flex-1"
          >
            {isUrdu ? "منسوخ" : "Cancel"}
          </Button>
          <Button
            variant="accent"
            size="md"
            loading={detectBusy}
            disabled={!detectCam.active || detectBusy}
            onClick={runDetectAndSend}
            className="flex-1 font-semibold shadow-sm"
          >
            {detectBusy ? (isUrdu ? "پہچان رہے ہیں…" : "Detecting…") : (isUrdu ? "پہچانیں" : "Detect Now")}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Card variant="camera" padding="none" className="aspect-video relative">
          <video
            ref={detectCam.videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {!detectCam.active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/75 text-sm p-4 text-center bg-black/80">
              <Camera className="w-8 h-8 text-white/50 mb-2" aria-hidden="true" />
              <p>{detectCam.error || (isUrdu ? "کیمرہ شروع ہو رہا ہے…" : "Starting camera preview…")}</p>
            </div>
          )}
        </Card>

        {detectStatus && (
          <div className={`p-2.5 rounded-aiden-md text-xs sm:text-sm text-center font-medium flex items-center justify-center gap-1.5 ${
            detectSuccess
              ? "bg-aiden-success-light text-aiden-success border border-aiden-success/20"
              : "bg-aiden-primary-light text-aiden-primary border border-aiden-primary/20"
          }`}>
            {detectSuccess && <Check className="w-4 h-4 text-aiden-success" />}
            <span>{detectStatus}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

