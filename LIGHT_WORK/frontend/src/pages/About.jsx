import { useApp } from "../context/AppContext";
import Avatar from "../components/Avatar";
import { Card, Badge } from "../components/ui";
import { Hand, Camera, BookOpen, MessageSquare, ShieldCheck } from "lucide-react";

export default function About() {
  const { t, language } = useApp();

  const features = [
    {
      titleEn: "Sign Talk & PSL Recognition",
      titleUr: "اشاروں کی زبان اور پی ایس ایل شناخت",
      tag: "MediaPipe + ONNX",
      en: "Sign Talk recognizes 20 Pakistan Sign Language (PSL) gestures in real-time and demonstrates them back through the avatar teacher.",
      ur: "اشاروں کی بات PSL کے 20 اشارے پہچانتی ہے اور ایویٹار کے ذریعے واپس دکھاتی ہے۔",
      icon: <Hand className="w-5 h-5 text-aiden-primary" />,
    },
    {
      titleEn: "AI Vision & Multimodal Guide",
      titleUr: "کیمرہ گائیڈ اور بصری مدد",
      tag: "MobileNet + Tesseract",
      en: "Camera Guide narrates surroundings, detects objects, reads physical printed documents aloud, and identifies Pakistani Rupee (PKR) banknotes.",
      ur: "کیمرہ گائیڈ اردگرد کا حال بتاتا ہے، چیزیں پہچانتا ہے، تحریر پڑھتا ہے، اور روپے کے نوٹ پہچانتا ہے۔",
      icon: <Camera className="w-5 h-5 text-aiden-primary" />,
    },
    {
      titleEn: "Interactive PSL Learning Hub",
      titleUr: "سیکھنے کا تعلیمی موڈ",
      tag: "Visual Curriculum",
      en: "Structured curriculum designed for deaf students and hearing peers to practice and master PSL signs with live visual feedback.",
      ur: "سیکھنے کا موڈ ایویٹار استاد کے ساتھ قدم بہ قدم PSL سکھاتا ہے۔",
      icon: <BookOpen className="w-5 h-5 text-aiden-primary" />,
    },
    {
      titleEn: "Accessible Calls & Messaging",
      titleUr: "رسائی چیٹ اور ہم وقت کالز",
      tag: "WebRTC + Socket.IO",
      en: "Inclusive communication portal enabling text, voice, and face-to-face video calling with integrated assistive detection tools.",
      ur: "چیٹ اور کالز سے آپ دوسرے AIDEN صارفین سے آسانی سے بات چیت کر سکتے ہیں۔",
      icon: <MessageSquare className="w-5 h-5 text-aiden-primary" />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <Card variant="standard" padding="lg" className="border-aiden-border/60">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative shrink-0 p-2 rounded-2xl bg-aiden-primary-light/50 border border-aiden-primary/20">
            <Avatar size={90} expression="happy" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <Badge variant="primary">AIDEN Platform</Badge>
              <Badge variant="accent">v2.0 Accessible</Badge>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-aiden-ink">
              {t("about_title")}
            </h1>
            <p className="text-sm sm:text-base text-aiden-ink/75 mt-1 font-medium">
              {t("tagline")}
            </p>
          </div>
        </div>
      </Card>

      {/* Feature Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f, i) => (
          <Card key={i} variant="interactive" padding="md" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-aiden-md bg-aiden-primary-light flex items-center justify-center">
                  {f.icon}
                </div>
                <Badge variant="default" size="sm">{f.tag}</Badge>
              </div>
              <h2 className="text-base font-bold text-aiden-ink mb-1">
                {language === "ur" ? f.titleUr : f.titleEn}
              </h2>
              <p className={`text-sm text-aiden-ink/70 leading-relaxed ${language === "ur" ? "font-urdu text-base text-right" : ""}`}>
                {language === "ur" ? f.ur : f.en}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Privacy & Beta Notice */}
      <Card variant="subtle" padding="md" className="border-dashed">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-aiden-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-aiden-ink/70 mb-0.5">
              {language === "ur" ? "رازداری اور بیٹا نوٹس" : "Local Inference & Privacy Notice"}
            </h3>
            <p className="text-xs text-aiden-ink/60 leading-relaxed">
              {language === "ur"
                ? "نوٹ: اشاروں، کرنسی اور بصری پہچان کے ماڈلز آپ کے براؤزر کے اندر براہِ راست چلتے ہیں۔ کیمرہ کا ڈیٹا کسی تیسرے فریق کے سرور پر نہیں بھیجا جاتا۔"
                : "Note: Sign and currency recognition run on lightweight, in-browser neural models (ONNX Web & MediaPipe). Your camera video frames never leave your device."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
