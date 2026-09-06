import { useCallback, useEffect, useRef, useState } from "react";
import { describeMediaError, isSecureContextForMedia } from "./mediaErrors";

// options: { audio?: boolean } — pass audio:true when a caller (e.g. chat
// recording) needs mic access along with the camera.
export function useCamera(language = "en") {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  const start = useCallback(
    async (facingMode = "environment", options = {}) => {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          language === "ur"
            ? "یہ براؤزر کیمرہ سپورٹ نہیں کرتا۔"
            : "This browser doesn't support camera access."
        );
        return false;
      }
      if (!isSecureContextForMedia()) {
        setError(describeMediaError(null, language));
        return false;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: !!options.audio,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setActive(true);
        return true;
      } catch (err) {
        setError(describeMediaError(err, language));
        setActive(false);
        return false;
      }
    },
    [language]
  );

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  // THE FIX: previously, navigating away (SignTalk -> another tab) without
  // pressing "Stop Camera" left the camera/mic stream running in the
  // background forever — the browser then reported the device as "already
  // in use" on every other page until a manual page refresh. Now the stream
  // is always released the moment this component unmounts, no matter how
  // the user left the page.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, []);

  return { videoRef, streamRef, active, error, start, stop };
}
