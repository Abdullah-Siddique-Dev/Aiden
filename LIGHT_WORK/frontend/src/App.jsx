import { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useApp } from "./context/AppContext";
import {
  Home as HomeIcon,
  Camera,
  BookOpen,
  Hand,
  GraduationCap,
  MessageSquare,
  Settings as SettingsIcon,
  Info,
  LogOut,
  Menu,
  X,
  Volume2,
} from "lucide-react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Learning from "./pages/Learning";
import AssistantButton from "./components/AssistantButton";
import AidenAssistantChat from "./components/AidenAssistantChat";
import Avatar from "./components/Avatar";

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
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3 bg-aiden-bg text-aiden-text-secondary select-none">
      <Avatar expression="thinking" size={90} className="animate-pulse" />
      <p className="text-sm font-medium tracking-wide">{children}</p>
    </div>
  );
}

const NAV = [
  { to: "/", key: "nav_home", icon: HomeIcon, label: "Home" },
  { to: "/vision", key: "nav_vision", icon: Camera, label: "Vision" },
  { to: "/text-reader", key: "nav_text_reader", icon: BookOpen, label: "Reader" },
  { to: "/sign", key: "nav_sign", icon: Hand, label: "Sign Talk" },
  { to: "/learning", key: "nav_learning", icon: GraduationCap, label: "Learning" },
  { to: "/chat", key: "nav_chat", icon: MessageSquare, label: "Chat & Calls" },
  { to: "/settings", key: "nav_settings", icon: SettingsIcon, label: "Settings" },
  { to: "/about", key: "nav_about", icon: Info, label: "About" },
];

export default function App() {
  const { user, token, logout } = useAuth();
  const { t, highContrast, language, speak, needsVoiceUnlock } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const location = useLocation();

  const currentNavItem = NAV.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (assistantOpen) setAssistantOpen(false);
        if (mobileNavOpen) setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [assistantOpen, mobileNavOpen]);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-aiden-bg ${highContrast ? "high-contrast" : ""}`}>
      {needsVoiceUnlock && (
        <div className="fixed inset-x-0 top-0 z-50 bg-aiden-accent text-aiden-text-primary text-xs sm:text-sm font-semibold text-center py-2.5 px-4 shadow-md flex items-center justify-center gap-2">
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>
            {language === "ur"
              ? "آواز کو فعال کرنے کے لیے کہیں بھی ٹیپ کریں"
              : "Tap anywhere once to enable voice narration"}
          </span>
        </div>
      )}

      {user && (
        <>
          {/* Mobile Top App Bar */}
          <header className="md:hidden sticky top-0 z-30 bg-aiden-surface border-b border-aiden-border px-4 py-3 flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2.5">
              <Avatar expression="happy" size={36} />
              <div>
                <span className="font-display text-base font-bold text-aiden-primary">AIDEN</span>
                {currentNavItem && (
                  <span className="text-xs text-aiden-text-muted ml-2">· {t(currentNavItem.key)}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              className="p-2 rounded-aiden-md text-aiden-text-secondary hover:text-aiden-primary hover:bg-aiden-surface-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent"
            >
              {mobileNavOpen ? (
                <X className="w-5 h-5 text-aiden-text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-aiden-text-primary" />
              )}
            </button>
          </header>

          {/* Mobile Navigation Drawer / Dropdown */}
          {mobileNavOpen && (
            <div
              className="md:hidden fixed inset-0 top-[57px] z-40 bg-aiden-text-primary/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setMobileNavOpen(false)}
            >
              <div
                className="bg-aiden-surface border-b border-aiden-border p-4 shadow-modal max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-aiden-border">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-aiden-primary-light text-aiden-primary font-bold flex items-center justify-center text-xs">
                      {user.name?.charAt(0)?.toUpperCase() || "A"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-aiden-text-primary">{user.name}</p>
                      <p className="text-xs text-aiden-text-muted">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-aiden-primary-light text-aiden-primary">
                    {t(`role_${user.disability_type || "none"}`)}
                  </span>
                </div>

                <ul className="space-y-1">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === "/"}
                          onClick={() => setMobileNavOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3.5 py-3 rounded-aiden-md text-sm transition-all duration-150 ${
                              isActive
                                ? "bg-aiden-primary text-white font-semibold shadow-sm"
                                : "text-aiden-text-secondary hover:bg-aiden-surface-secondary hover:text-aiden-text-primary"
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-aiden-text-secondary"}`} />
                              <span>{t(item.key)}</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>

                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    logout();
                  }}
                  className="w-full mt-4 pt-3 border-t border-aiden-border text-left px-3 py-2.5 text-sm text-aiden-danger hover:bg-aiden-danger-light/30 rounded-aiden-md font-medium transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>{t("logout")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Desktop Navigation Sidebar */}
          <nav
            className="hidden md:flex w-64 bg-aiden-primary-hover text-white flex-col shrink-0 select-none shadow-subtle z-20"
            aria-label="Main navigation"
          >
            <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
              <Avatar expression="happy" size={40} className="shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-xl font-bold tracking-tight text-white">
                    {t("app_name")}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-aiden-accent" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-white/60 tracking-wide uppercase font-medium">
                  Accessibility AI
                </p>
              </div>
            </div>

            <ul className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-aiden-md text-sm transition-all duration-150 relative group ${
                          isActive
                            ? "bg-white/15 text-white font-semibold shadow-sm"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-aiden-accent"
                              aria-hidden="true"
                            />
                          )}
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? "text-aiden-accent" : "text-white/70 group-hover:text-white"
                            }`}
                          />
                          <span className="truncate">{t(item.key)}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            {/* Desktop User Footer */}
            <div className="p-3 border-t border-white/10 bg-black/10">
              <div className="px-3 py-2 flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-7 h-7 rounded-full bg-aiden-accent text-aiden-text-primary font-bold flex items-center justify-center text-xs shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-white/60 truncate">
                      {t(`role_${user.disability_type || "none"}`)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full mt-1 px-3 py-2 text-xs text-white/75 hover:text-white hover:bg-white/10 rounded-aiden-sm transition-colors text-left flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{t("logout")}</span>
              </button>
            </div>
          </nav>
        </>
      )}

      <main className="flex-1 min-w-0 relative flex flex-col overflow-y-auto">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
          <Route
            path="/"
            element={
              <Protected>
                <Home />
              </Protected>
            }
          />
          <Route
            path="/vision"
            element={
              <Protected>
                <Suspense fallback={<Centered>Loading camera guide…</Centered>}>
                  <Vision />
                </Suspense>
              </Protected>
            }
          />
          <Route
            path="/sign"
            element={
              <Protected>
                <Suspense fallback={<Centered>Loading sign recognition…</Centered>}>
                  <SignTalk />
                </Suspense>
              </Protected>
            }
          />
          <Route
            path="/learning"
            element={
              <Protected>
                <Learning />
              </Protected>
            }
          />
          <Route
            path="/text-reader"
            element={
              <Protected>
                <Suspense fallback={<Centered>Loading text reader…</Centered>}>
                  <TextReader />
                </Suspense>
              </Protected>
            }
          />
          <Route
            path="/chat"
            element={
              <Protected>
                <Suspense fallback={<Centered>Loading chat…</Centered>}>
                  <Chat />
                </Suspense>
              </Protected>
            }
          />
          <Route path="/calls" element={<Navigate to="/chat?tab=calls" replace />} />
          <Route
            path="/settings"
            element={
              <Protected>
                <Settings />
              </Protected>
            }
          />
          <Route
            path="/about"
            element={
              <Protected>
                <About />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {user && (
          <AssistantButton
            isOpen={assistantOpen}
            onClick={() => setAssistantOpen(!assistantOpen)}
          />
        )}

        {/* Global Slide-Over AI Assistant Panel */}
        {assistantOpen && user && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-fade-in"
              onClick={() => setAssistantOpen(false)}
              aria-hidden="true"
            />
            <aside
              className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] max-w-full bg-aiden-surface border-l border-aiden-border shadow-modal flex flex-col animate-fade-in"
              role="dialog"
              aria-label="AIDEN AI Assistant"
            >
              <AidenAssistantChat
                token={token}
                language={language}
                speak={speak}
                t={t}
                onClose={() => setAssistantOpen(false)}
              />
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
