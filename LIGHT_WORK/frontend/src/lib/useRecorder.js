import { useCallback, useEffect, useRef, useState } from "react";
import { describeMediaError, isSecureContextForMedia } from "./mediaErrors";

const VIDEO_MAX_SECONDS = 60;

// kind: "voice" (audio only) or "video" (audio+video, hard 60s auto-stop).
export function useRecorder(kind, language = "en") {
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [previewStream, setPreviewStream] = useState(null);

  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    setSeconds(elapsed);
    if (kind === "video" && elapsed >= VIDEO_MAX_SECONDS) {
      stop(); // eslint-disable-line no-use-before-define
    }
  }, [kind]);

  const start = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(language === "ur" ? "یہ براؤزر ریکارڈنگ سپورٹ نہیں کرتا۔" : "This browser doesn't support recording.");
      return false;
    }
    if (!isSecureContextForMedia()) {
      setError(describeMediaError(null, language));
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video" ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
      streamRef.current = stream;
      setPreviewStream(stream);

      const mimeType =
        kind === "video"
          ? (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" : "video/webm")
          : (MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm");

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorderRef.current = recorder;
      recorder.start();

      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(tick, 250);
      return true;
    } catch (err) {
      setError(describeMediaError(err, language));
      return false;
    }
  }, [kind, language, tick]);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      clearInterval(timerRef.current);
      setRecording(false);
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setPreviewStream(null);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  const cancel = useCallback(() => {
    clearInterval(timerRef.current);
    setRecording(false);
    try { recorderRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPreviewStream(null);
    chunksRef.current = [];
  }, []);

  // Same fix as useCamera.js — release the mic/camera the moment this
  // component unmounts (e.g. user navigates away mid-recording), so it
  // doesn't stay locked and block the next page's camera/mic request.
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      try { recorderRef.current?.state !== "inactive" && recorderRef.current?.stop(); } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return { start, stop, cancel, recording, seconds, error, previewStream, maxSeconds: kind === "video" ? VIDEO_MAX_SECONDS : null };
}
