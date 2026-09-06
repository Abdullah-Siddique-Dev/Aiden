import { useCallback, useRef, useState } from "react";

// Wraps the browser's SpeechRecognition API for English/Urdu speech input.
export function useSpeechInput(language) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const start = useCallback(
    (onResult) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition isn't supported in this browser. Try Chrome.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = language === "ur" ? "ur-PK" : "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const text = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(" ");
        setTranscript(text);
        if (event.results[event.results.length - 1].isFinal) {
          onResult?.(text);
        }
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      setTranscript("");
      setListening(true);
      recognition.start();
    },
    [language]
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, transcript, start, stop };
}
