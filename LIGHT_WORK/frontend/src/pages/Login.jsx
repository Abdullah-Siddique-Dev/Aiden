import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import Avatar from "../components/Avatar";
import { Card, Input, Button } from "../components/ui";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { t, language } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isUrdu = language === "ur";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center aiden-ambient-bg px-4 py-10 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative mb-2">
            <div className="absolute -inset-3 bg-gradient-to-tr from-aiden-primary/25 via-aiden-accent/30 to-transparent rounded-full blur-xl -z-10" />
            <Avatar size={105} expression="encouraging" className="drop-shadow-md" />
          </div>
          <h1 className="font-display text-3xl font-bold text-aiden-primary tracking-tight">
            {t("app_name")}
          </h1>
          <p className={`text-xs sm:text-sm text-aiden-text-secondary mt-1 max-w-xs ${isUrdu ? "font-urdu text-base" : ""}`}>
            {t("tagline")}
          </p>
        </div>

        <Card variant="standard" padding="lg" className="shadow-modal border-aiden-border/80">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h2 className={`text-xl font-display font-bold text-aiden-text-primary ${isUrdu ? "font-urdu text-2xl" : ""}`}>
                {t("welcome_back")}
              </h2>
              <p className="text-xs text-aiden-text-muted mt-0.5">
                {isUrdu ? "اپنے اکاؤنٹ میں لاگ ان کریں" : "Sign in to access your accessibility tools"}
              </p>
            </div>

            {error && (
              <div className="bg-aiden-danger-light text-aiden-danger text-xs sm:text-sm p-3 rounded-aiden-md border border-aiden-danger/25 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-aiden-danger" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="email"
              type="email"
              label={t("email")}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Input
              id="password"
              type="password"
              label={t("password")}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={busy}
              className="w-full font-semibold shadow-sm mt-2"
            >
              {busy ? "Signing in…" : t("login")}
            </Button>

            <p className="text-xs sm:text-sm text-center text-aiden-text-secondary pt-2 border-t border-aiden-border-subtle">
              {isUrdu ? "اکاؤنٹ نہیں ہے؟ " : "Don't have an account? "}
              <Link to="/signup" className="text-aiden-primary font-semibold hover:underline">
                {t("signup")}
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

