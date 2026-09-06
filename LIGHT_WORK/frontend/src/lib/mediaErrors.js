// Central place for turning a getUserMedia() failure into a specific,
// actionable message — used by useCamera.js, useRecorder.js, and anywhere
// else that touches the camera/mic, so the wording stays consistent and no
// caller falls back to a generic "denied or unavailable" string.
export function isSecureContextForMedia() {
  // getUserMedia only works on HTTPS or localhost/127.0.0.1.
  return window.isSecureContext || ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export function describeMediaError(err, language = "en") {
  const ur = language === "ur";

  if (!isSecureContextForMedia()) {
    return ur
      ? "کیمرہ/مائیک صرف HTTPS یا localhost پر کام کرتا ہے۔ براہ کرم ایپ کو محفوظ (https) کنکشن پر کھولیں۔"
      : "Camera/microphone only work over HTTPS or on localhost. Open this app on a secure (https) connection and try again.";
  }

  const name = err?.name || "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return ur
      ? "اجازت نہیں دی گئی۔ براؤزر کے ایڈریس بار میں کیمرہ آئیکن پر ٹیپ کریں، اجازت دیں، پھر دوبارہ کوشش کریں۔"
      : "Permission denied. Tap the camera icon in your browser's address bar, choose Allow, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return ur
      ? "اس ڈیوائس پر کیمرہ/مائیک نہیں ملا۔"
      : "No camera or microphone was found on this device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return ur
      ? "کیمرہ/مائیک کسی اور ایپ یا ٹیب کے زیرِ استعمال ہے۔ اسے بند کر کے دوبارہ کوشش کریں۔"
      : "Your camera/mic is already in use by another app or browser tab. Close it and try again.";
  }
  if (name === "AbortError") {
    return ur ? "کیمرہ شروع نہیں ہو سکا، دوبارہ کوشش کریں۔" : "Couldn't start the camera — please try again.";
  }

  return ur
    ? "کیمرہ/مائیک تک رسائی ممکن نہیں ہو سکی۔"
    : "Couldn't access the camera/microphone.";
}
