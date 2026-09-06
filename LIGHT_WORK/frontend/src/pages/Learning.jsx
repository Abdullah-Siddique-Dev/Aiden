import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import SignPictureBox from "../components/SignPictureBox";

export default function Learning() {
  const { t, language, speak } = useApp();
  const { token } = useAuth();
  const [curriculum, setCurriculum] = useState([]);
  const [signs, setSigns] = useState([]);
  const [level, setLevel] = useState(1);
  const [lessonId, setLessonId] = useState(null);
  const [signIndex, setSignIndex] = useState(0);
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    fetch("/api/signs/curriculum")
      .then((r) => r.json())
      .then((d) => {
        setCurriculum(d.curriculum);
        setSigns(d.signs);
        const firstLevel1 = d.curriculum.find((l) => l.level === 1);
        setLessonId((firstLevel1 || d.curriculum[0])?.id);
      });
  }, []);

  const signById = Object.fromEntries(signs.map((s) => [s.id, s]));
  const lesson = curriculum.find((l) => l.id === lessonId);
  const currentSign = lesson ? signById[lesson.signIds[signIndex]] : null;
  const lessonsForLevel = curriculum.filter((l) => (l.level || 2) === level);

  function pickLevel(lv) {
    setLevel(lv);
    const first = curriculum.find((l) => (l.level || 2) === lv);
    if (first) { setLessonId(first.id); setSignIndex(0); }
  }

  function teach() {
    if (!currentSign) return;
    const name = language === "ur" ? currentSign.ur : currentSign.en;
    // Text-only items (e.g. counting by 10s) just speak the number/word —
    // there's no hand-shape cue to describe since no trained sign model
    // covers them (honest limitation, not a bug).
    const sentence =
      currentSign.kind === "text"
        ? name
        : language === "ur"
        ? `یہ "${name}" کا اشارہ ہے — ${currentSign.cue}`
        : `This is the sign for "${name}" — ${currentSign.cue}`;
    speak(sentence);
  }

  // Auto-speak whenever the shown item changes (first load, Next, Prev, or
  // switching lessons) — previously this required tapping "Hear it again"
  // every single time, which wasn't the intended default behavior.
  useEffect(() => {
    if (currentSign) teach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSign?.id]);

  function markComplete() {
    setCompleted((c) => ({ ...c, [currentSign.id]: true }));
  }

  function nextSign() {
    if (!lesson) return;
    setSignIndex((i) => Math.min(i + 1, lesson.signIds.length - 1));
  }
  function prevSign() {
    setSignIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-4">{t("learning_title")}</h1>

      <div className="flex gap-2 mb-4">
        {[1, 2].map((lv) => (
          <button
            key={lv}
            onClick={() => pickLevel(lv)}
            className={`rounded-card px-4 py-2 text-sm font-semibold border-2 ${
              level === lv ? "bg-ink text-white border-ink" : "bg-white border-ink/20 text-ink/70"
            }`}
          >
            {language === "ur" ? `سطح ${lv === 1 ? "۱" : "۲"}` : `Level ${lv}`}
            {" — "}
            {lv === 1
              ? (language === "ur" ? "ہندسے، حروف" : "Digits & Alphabets")
              : (language === "ur" ? "الفاظ اور فقرے" : "Words & Phrases")}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {lessonsForLevel.map((l) => (
          <button
            key={l.id}
            onClick={() => { setLessonId(l.id); setSignIndex(0); }}
            className={`rounded-card px-4 py-2 border hairline text-sm font-medium ${lessonId === l.id ? "bg-teal text-white" : "bg-white"}`}
          >
            {language === "ur" ? l.title_ur : l.title_en}
          </button>
        ))}
      </div>

      {currentSign && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border hairline rounded-card p-8 flex flex-col items-center text-center">
            <SignPictureBox id={currentSign.id} label={language === "ur" ? currentSign.ur : currentSign.en} size={180} />
            <p className={`text-3xl font-display font-semibold mt-4 ${language === "ur" ? "font-urdu" : ""}`}>
              {language === "ur" ? currentSign.ur : currentSign.en}
            </p>
            {currentSign.kind !== "text" && (
              <p className="text-ink/60 text-sm mt-2 max-w-xs">{currentSign.cue}</p>
            )}
            {currentSign.kind && currentSign.kind !== "text" && (
              <p className="text-xs uppercase tracking-wide text-ink/30 mt-3">
                {language === "ur" ? "بصری/آواز — کیمرہ نہیں" : "Audio flashcard — practice with Sign Talk's camera separately"}
              </p>
            )}
            <button onClick={teach} className="mt-5 bg-marigold text-ink rounded-card px-5 py-2.5 font-medium">
              🔊 {language === "ur" ? "دوبارہ سنیں" : "Hear it again"}
            </button>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm text-ink/50 mb-2">
                {signIndex + 1} / {lesson.signIds.length}
              </p>
              <ul className="space-y-1 max-h-80 overflow-y-auto">
                {lesson.signIds.map((id, i) => (
                  <li
                    key={id}
                    className={`px-3 py-2 rounded-card text-sm flex items-center justify-between ${
                      i === signIndex ? "bg-teal-light font-medium" : "bg-white border hairline"
                    }`}
                  >
                    <span className={language === "ur" ? "font-urdu" : ""}>
                      {language === "ur" ? signById[id]?.ur : signById[id]?.en}
                    </span>
                    {completed[id] && <span className="text-teal">✓</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={prevSign} disabled={signIndex === 0} className="flex-1 border hairline rounded-card py-2.5 disabled:opacity-30">
                ← {language === "ur" ? "پچھلا" : "Prev"}
              </button>
              <button onClick={markComplete} className="flex-1 bg-teal text-white rounded-card py-2.5 font-medium">
                {t("lesson_complete")}
              </button>
              <button onClick={nextSign} disabled={signIndex === lesson.signIds.length - 1} className="flex-1 border hairline rounded-card py-2.5 disabled:opacity-30">
                {language === "ur" ? "اگلا" : "Next"} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
