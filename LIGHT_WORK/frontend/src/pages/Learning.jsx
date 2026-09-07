import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import SignPictureBox from "../components/SignPictureBox";
import { Button, Card, Badge, ProgressBar } from "../components/ui";
import {
  PartyPopper,
  Check,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default function Learning() {
  const { t, language, speak } = useApp();
  const [curriculum, setCurriculum] = useState([]);
  const [signs, setSigns] = useState([]);
  const [level, setLevel] = useState(1);
  const [lessonId, setLessonId] = useState(null);
  const [signIndex, setSignIndex] = useState(0);
  const [completed, setCompleted] = useState({});
  const [justMastered, setJustMastered] = useState(false);
  const isUrdu = language === "ur";

  useEffect(() => {
    fetch("/api/signs/curriculum")
      .then((r) => r.json())
      .then((d) => {
        setCurriculum(d.curriculum || []);
        setSigns(d.signs || []);
        const firstLevel1 = d.curriculum?.find((l) => l.level === 1);
        setLessonId((firstLevel1 || d.curriculum?.[0])?.id);
      });
  }, []);

  const signById = Object.fromEntries(signs.map((s) => [s.id, s]));
  const lesson = curriculum.find((l) => l.id === lessonId);
  const currentSign = lesson ? signById[lesson.signIds[signIndex]] : null;
  const lessonsForLevel = curriculum.filter((l) => (l.level || 2) === level);

  function pickLevel(lv) {
    setLevel(lv);
    const first = curriculum.find((l) => (l.level || 2) === lv);
    if (first) {
      setLessonId(first.id);
      setSignIndex(0);
    }
  }

  function teach() {
    if (!currentSign) return;
    const name = isUrdu ? currentSign.ur : currentSign.en;
    const sentence =
      currentSign.kind === "text"
        ? name
        : isUrdu
        ? `یہ "${name}" کا اشارہ ہے — ${currentSign.cue}`
        : `This is the sign for "${name}" — ${currentSign.cue}`;
    speak(sentence);
  }

  useEffect(() => {
    if (currentSign) teach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSign?.id]);

  function markComplete() {
    if (!currentSign) return;
    const updated = { ...completed, [currentSign.id]: true };
    setCompleted(updated);

    // Check if entire lesson is now complete
    if (lesson && lesson.signIds.every((id) => updated[id])) {
      setJustMastered(true);
    } else {
      nextSign();
    }
  }

  function nextSign() {
    if (!lesson) return;
    setSignIndex((i) => Math.min(i + 1, lesson.signIds.length - 1));
  }

  function prevSign() {
    setSignIndex((i) => Math.max(i - 1, 0));
  }

  function nextLesson() {
    setJustMastered(false);
    const currentIdx = lessonsForLevel.findIndex((l) => l.id === lessonId);
    if (currentIdx !== -1 && currentIdx + 1 < lessonsForLevel.length) {
      setLessonId(lessonsForLevel[currentIdx + 1].id);
      setSignIndex(0);
    } else if (level === 1) {
      pickLevel(2);
    }
  }

  const lessonCompletedCount = lesson
    ? lesson.signIds.filter((id) => completed[id]).length
    : 0;

  const isLessonFinished =
    lesson && lesson.signIds.length > 0 && lessonCompletedCount === lesson.signIds.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-2xl sm:text-3xl font-bold text-aiden-text-primary ${isUrdu ? "font-urdu" : ""}`}>
              {t("learning_title")}
            </h1>
            <Badge variant="accent" size="sm">
              Interactive Academy
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-aiden-text-secondary mt-0.5">
            {isUrdu
              ? "قدم بہ قدم پاکستان اشاروں کی زبان (PSL) سیکھیں اور پریکٹس کریں"
              : "Structured Pakistan Sign Language curriculum with interactive flashcards and audio narration"}
          </p>
        </div>
      </div>

      {/* Level Selection Bar */}
      <div className="flex gap-2.5">
        {[1, 2].map((lv) => (
          <button
            key={lv}
            onClick={() => pickLevel(lv)}
            className={`px-4 py-2.5 rounded-aiden-md text-xs sm:text-sm font-bold border transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent ${
              level === lv
                ? "bg-aiden-primary text-white border-aiden-primary shadow-sm"
                : "bg-aiden-surface text-aiden-text-secondary border-aiden-border hover:bg-aiden-surface-secondary hover:text-aiden-text-primary"
            }`}
          >
            <span>{isUrdu ? `سطح ${lv === 1 ? "۱" : "۲"}` : `Level ${lv}`}</span>
            <span className="opacity-80 ml-1.5 font-normal">
              — {lv === 1 ? (isUrdu ? "ہندسے، حروف" : "Digits & Alphabets") : (isUrdu ? "الفاظ اور جملے" : "Essential Words")}
            </span>
          </button>
        ))}
      </div>

      {/* Lessons Pills for Current Level */}
      <div className="flex flex-wrap gap-2">
        {lessonsForLevel.map((l) => {
          const isSelected = lessonId === l.id;
          const isAllDone = l.signIds.every((id) => completed[id]);
          return (
            <button
              key={l.id}
              onClick={() => {
                setLessonId(l.id);
                setSignIndex(0);
                setJustMastered(false);
              }}
              className={`px-3.5 py-1.5 rounded-aiden-md text-xs sm:text-sm font-semibold border transition-all duration-150 select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent ${
                isSelected
                  ? "bg-aiden-primary-light text-aiden-primary border-aiden-primary/40 shadow-sm"
                  : "bg-aiden-surface text-aiden-text-secondary border-aiden-border hover:bg-aiden-surface-secondary"
              }`}
            >
              <span>{isUrdu ? l.title_ur : l.title_en}</span>
              {isAllDone && <Check className="w-3.5 h-3.5 text-aiden-success" />}
            </button>
          );
        })}
      </div>

      {/* Lesson Finished / Mastered Notification Banner */}
      {isLessonFinished && (
        <Card variant="ai" padding="md" className="border-aiden-accent/50 shadow-subtle animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-aiden-accent shrink-0" />
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-aiden-text-primary">
                {isUrdu ? "ماشاءاللہ! آپ نے یہ سبق مکمل کر لیا ہے" : "Lesson Mastered!"}
              </h3>
              <p className="text-xs text-aiden-text-secondary">
                {isUrdu ? "آپ نے اس سبق کے تمام اشارے سیکھ لیے ہیں" : "You have completed all signs in this lesson."}
              </p>
            </div>
          </div>
          <Button
            variant="accent"
            size="md"
            onClick={nextLesson}
            className="font-bold shadow-sm self-stretch sm:self-auto inline-flex items-center gap-1.5"
          >
            <span>{isUrdu ? "اگلا سبق شروع کریں" : "Proceed to Next Lesson"}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      )}

      {currentSign && lesson && (
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {/* Left Column: Big Interactive Flashcard */}
          <Card
            variant="standard"
            padding="lg"
            className="flex flex-col items-center justify-between text-center shadow-card min-h-[420px]"
          >
            <div className="w-full flex justify-between items-center mb-2">
              <Badge variant="primary" size="sm">
                Sign {signIndex + 1} of {lesson.signIds.length}
              </Badge>
              {completed[currentSign.id] ? (
                <Badge variant="success" size="sm" className="inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{isUrdu ? "مکمل" : "Mastered"}</span>
                </Badge>
              ) : (
                <span className="text-xs text-aiden-text-muted">Practice Mode</span>
              )}
            </div>

            <div className="my-auto py-4 flex flex-col items-center">
              <SignPictureBox
                id={currentSign.id}
                label={isUrdu ? currentSign.ur : currentSign.en}
                size={190}
              />

              <h2
                className={`text-3xl sm:text-4xl font-display font-bold text-aiden-text-primary mt-4 tracking-tight ${
                  isUrdu ? "font-urdu text-5xl" : ""
                }`}
              >
                {isUrdu ? currentSign.ur : currentSign.en}
              </h2>

              {currentSign.kind !== "text" && currentSign.cue && (
                <p className="text-xs sm:text-sm text-aiden-text-secondary mt-2 max-w-sm leading-relaxed">
                  {currentSign.cue}
                </p>
              )}
            </div>

            <div className="w-full pt-4 border-t border-aiden-border-subtle flex justify-center">
              <Button
                variant="secondary"
                size="md"
                onClick={teach}
                icon={<Volume2 className="w-4 h-4" />}
                className="font-semibold shadow-sm"
              >
                {isUrdu ? "دوبارہ سنیں" : "Hear audio cue"}
              </Button>
            </div>
          </Card>

          {/* Right Column: Lesson Checklist & Navigation */}
          <div className="flex flex-col justify-between space-y-4">
            <Card variant="standard" padding="md" className="shadow-subtle">
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-semibold text-aiden-text-secondary mb-1">
                  <span>{isUrdu ? "سبق کی پیش رفت" : "Lesson Progress"}</span>
                  <span className="font-mono font-bold text-aiden-primary">
                    {lessonCompletedCount} / {lesson.signIds.length} ({Math.round((lessonCompletedCount / lesson.signIds.length) * 100)}%)
                  </span>
                </div>
                <ProgressBar
                  value={(lessonCompletedCount / lesson.signIds.length) * 100}
                  variant="primary"
                  size="sm"
                />
              </div>

              <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1 divide-y divide-aiden-border-subtle">
                {lesson.signIds.map((id, i) => {
                  const isCurrent = i === signIndex;
                  const isDone = completed[id];
                  return (
                    <li key={id} className="pt-1.5 first:pt-0">
                      <button
                        onClick={() => setSignIndex(i)}
                        className={`w-full px-3 py-2 rounded-aiden-md text-xs sm:text-sm flex items-center justify-between transition-all select-none ${
                          isCurrent
                            ? "bg-aiden-primary-light text-aiden-primary font-bold shadow-sm"
                            : "hover:bg-aiden-surface-secondary text-aiden-text-primary"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              isCurrent
                                ? "bg-aiden-primary text-white"
                                : "bg-aiden-surface-secondary text-aiden-text-muted"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className={isUrdu ? "font-urdu text-base" : ""}>
                            {isUrdu ? signById[id]?.ur : signById[id]?.en}
                          </span>
                        </div>
                        {isDone && <Check className="w-4 h-4 text-aiden-success" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Step Action Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={prevSign}
                disabled={signIndex === 0}
                icon={<ChevronLeft className="w-4 h-4" />}
                className="flex-1 font-semibold"
              >
                {isUrdu ? "پچھلا" : "Prev"}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={markComplete}
                icon={<Check className="w-4 h-4" />}
                className="flex-1 font-bold shadow-sm"
              >
                {completed[currentSign.id] ? "Done" : t("lesson_complete")}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={nextSign}
                disabled={signIndex === lesson.signIds.length - 1}
                className="flex-1 font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <span>{isUrdu ? "اگلا" : "Next"}</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
