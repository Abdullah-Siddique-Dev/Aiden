import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useApp } from "./context/AppContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Learning from "./pages/Learning";
import AssistantButton from "./components/AssistantButton";

// Vision, SignTalk, Chat (its "Detect & Send" pulls in the same ONNX/MediaPipe/TF.js
// stack), and TextReader (Tesseract.js) are code-split so someone who only uses
// calls/learning/settings never downloads the ML bundle.
const Vision = lazy(() => import("./pages/Vision"));
const SignTalk = lazy(() => import("./pages/SignTalk"));
const Chat = lazy(() => import("./pages/Chat"));
const TextReader = lazy(() => import("./pages/TextReader"));

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Centered>Loading AIDEN…</Centered>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Centered({ children }) {
  return <div className="h-screen flex items-center justify-center text-ink/60">{children}</div>;
}

const NAV = [
  { to: "/", key: "nav_home", icon: "🏠" },
  { to: "/vision", key: "nav_vision", icon: "📷" },
  { to: "/text-reader", key: "nav_text_reader", icon: "📖" },
  { to: "/sign", key: "nav_sign", icon: "🤟" },
  { to: "/learning", key: "nav_learning", icon: "🎓" },
  { to: "/chat", key: "nav_chat", icon: "💬" }, // Calls now lives inside Chat as a sub-tab
  { to: "/settings", key: "nav_settings", icon: "⚙️" },
  { to: "/about", key: "nav_about", icon: "ℹ️" },
];

export default function App() {
  const { user, logout } = useAuth();
  const { t, highContrast, language, needsVoiceUnlock } = useApp();

  return (
    <div className={`min-h-screen flex ${highContrast ? "high-contrast" : ""}`}>
      {needsVoiceUnlock && (
        <div className="fixed inset-x-0 top-0 z-50 bg-marigold text-ink text-sm text-center py-2">
          🔊 {language === "ur" ? "آواز کو فعال کرنے کے لیے کہیں بھی ٹیپ کریں" : "Tap anywhere once to enable voice"}
        </div>
      )}
      {user && (
        <nav className="w-20 md:w-56 bg-teal-dark text-white flex flex-col shrink-0" aria-label="Main navigation">
          <div className="px-4 py-5 flex items-center gap-2 border-b border-white/10">
            <span className="text-2xl" aria-hidden>🧑‍🏫</span>
            <span className="hidden md:inline font-display text-lg font-semibold">{t("app_name")}</span>
          </div>
          <ul className="flex-1 py-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm md:text-base hover:bg-white/10 transition-colors ${
                      isActive ? "bg-white/15 border-r-4 border-marigold" : ""
                    }`
                  }
                >
                  <span aria-hidden>{item.icon}</span>
                  <span className="hidden md:inline">{t(item.key)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <button
            onClick={logout}
            className="px-4 py-4 text-sm text-white/70 hover:text-white hover:bg-white/10 text-left border-t border-white/10"
          >
            {t("logout")}
          </button>
        </nav>
      )}

      <main className="flex-1 min-w-0 relative">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route
            path="/vision"
            element={<Protected><Suspense fallback={<Centered>Loading vision tools…</Centered>}><Vision /></Suspense></Protected>}
          />
          <Route
            path="/sign"
            element={<Protected><Suspense fallback={<Centered>Loading sign recognition…</Centered>}><SignTalk /></Suspense></Protected>}
          />
          <Route path="/learning" element={<Protected><Learning /></Protected>} />
          <Route path="/text-reader" element={<Protected><Suspense fallback={<Centered>Loading text reader…</Centered>}><TextReader /></Suspense></Protected>} />
          <Route path="/chat" element={<Protected><Suspense fallback={<Centered>Loading chat…</Centered>}><Chat /></Suspense></Protected>} />
          <Route path="/calls" element={<Navigate to="/chat?tab=calls" replace />} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/about" element={<Protected><About /></Protected>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {user && <AssistantButton />}
      </main>
    </div>
  );
}
