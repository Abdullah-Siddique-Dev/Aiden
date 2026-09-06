import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

const FEATURES = [
  { to: "/chat", icon: "💬", key: "nav_chat", desc_en: "Text, voice notes, video clips, and Detect & Send with someone.", desc_ur: "متن، آواز، ویڈیو، اور کسی کے ساتھ پہچان کر بھیجیں۔" },
  { to: "/vision", icon: "📷", key: "nav_vision", desc_en: "Point the camera and hear what's around you.", desc_ur: "کیمرہ سے اپنے ارد گرد کے بارے میں سنیں۔" },
  { to: "/sign", icon: "🤟", key: "nav_sign", desc_en: "Practice and detect Pakistan Sign Language.", desc_ur: "پاکستان اشاروں کی زبان کی مشق اور شناخت۔" },
  { to: "/learning", icon: "🎓", key: "nav_learning", desc_en: "Learn digits, alphabets, huroof, and common signs.", desc_ur: "ہندسے، حروف، اور عام اشارے سیکھیں۔" },
];

export default function Home() {
  const { t, language } = useApp();
  const { user } = useAuth();

  return (
    <div className="h-screen overflow-y-auto">
      {/* Hero */}
      <section className="px-6 pt-14 pb-10 text-center max-w-2xl mx-auto">
        <Avatar expression="hero" size={200} className="mx-auto mb-4" />
        <h1 className="font-display text-3xl font-semibold mb-2">
          {language === "ur" ? `خوش آمدید، ${user?.name}` : `Welcome, ${user?.name}`}
        </h1>
        <p className="text-ink/60 text-lg">{t("tagline")}</p>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-10 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <Link
            key={f.to}
            to={f.to}
            className="bg-white border hairline rounded-card p-5 hover:shadow-md transition-shadow flex gap-3 items-start"
          >
            <span className="text-3xl shrink-0" aria-hidden>{f.icon}</span>
            <div>
              <p className="font-semibold">{t(f.key)}</p>
              <p className="text-sm text-ink/60 mt-0.5">{language === "ur" ? f.desc_ur : f.desc_en}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* About strip */}
      <section className="px-6 pb-16 max-w-3xl mx-auto text-center">
        <p className="text-sm text-ink/50">
          {language === "ur"
            ? "AIDEN بہرے، گونگے، اور بصارت سے محروم افراد اور ان کے اہلِ خانہ کے درمیان مترجم ہے۔"
            : "AIDEN is a translator and accessibility companion between deaf, mute, and visually impaired users and their family."}
        </p>
        <Link to="/about" className="inline-block mt-3 text-teal font-medium text-sm underline">
          {t("nav_about")} →
        </Link>
      </section>
    </div>
  );
}
