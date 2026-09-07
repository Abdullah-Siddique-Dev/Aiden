import { useCallback, useEffect, useRef, useState } from "react";
import { describeMediaError, isSecureContextForMedia } from "./mediaErrors";

// options: { audio?: boolean } — pass audio:true when a caller (e.g. chat
// recording) needs mic access along with the camera.
export function useCamera(language = "en") {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");

  const start = useCallback(
    async (mode = facingMode, options = {}) => {
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
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
            audio: !!options.audio,
          });
        } catch {
          // Fallback if environment facingMode is not supported on single-camera laptop/desktop
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: !!options.audio,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Handled play interruption
          }
        }
        setFacingMode(mode);
        setActive(true);
        return true;
      } catch (err) {
        setError(describeMediaError(err, language));
        setActive(false);
        return false;
      }
    },
    [facingMode, language]
  );

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  const flipCamera = useCallback(async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    if (active) {
      stop();
      await start(nextMode);
    } else {
      setFacingMode(nextMode);
    }
  }, [facingMode, active, start, stop]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, []);

  return { videoRef, streamRef, active, error, facingMode, start, stop, flipCamera };
}
