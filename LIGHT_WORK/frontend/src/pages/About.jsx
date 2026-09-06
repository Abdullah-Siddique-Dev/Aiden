import { useApp } from "../context/AppContext";
import Avatar from "../components/Avatar";

export default function About() {
  const { t, language } = useApp();

  const items = [
    { en: "Sign Talk recognizes 20 PSL signs and demonstrates them back through the avatar.", ur: "اشاروں کی بات PSL کے 20 اشارے پہچانتی ہے اور ایویٹار کے ذریعے واپس دکھاتی ہے۔" },
    { en: "Camera Guide narrates surroundings, detects objects, reads text aloud, and identifies PKR notes.", ur: "کیمرہ گائیڈ اردگرد کا حال بتاتا ہے، چیزیں پہچانتا ہے، تحریر پڑھتا ہے، اور روپے کے نوٹ پہچانتا ہے۔" },
    { en: "Learning mode teaches PSL step by step with the avatar teacher.", ur: "سیکھنے کا موڈ ایویٹار استاد کے ساتھ قدم بہ قدم PSL سکھاتا ہے۔" },
    { en: "Chat and Calls let you message and talk face-to-face with other AIDEN users.", ur: "چیٹ اور کالز سے آپ دوسرے AIDEN صارفین سے بات چیت کر سکتے ہیں۔" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Avatar size={80} expression="happy" />
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("about_title")}</h1>
          <p className="text-ink/60 text-sm">{t("tagline")}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className={`bg-white border hairline rounded-card p-4 text-sm ${language === "ur" ? "font-urdu text-lg text-right" : ""}`}>
            {language === "ur" ? it.ur : it.en}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink/40 mt-6">
        {language === "ur"
          ? "نوٹ: اشاروں اور کرنسی کی پہچان ہلکے، براؤزر میں چلنے والے ماڈلز پر مبنی ہے اور ابھی بیٹا مرحلے میں ہے۔"
          : "Note: sign and currency recognition run on lightweight, in-browser models and are currently in beta."}
      </p>
    </div>
  );
}
