import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import Avatar from "../components/Avatar";
import { Card, Input, Select, Button } from "../components/ui";
import { AlertCircle } from "lucide-react";

const ROLES = ["deaf", "mute", "visually_impaired", "student", "caregiver", "teacher", "none"];

export default function Signup() {
  const { signup } = useAuth();
  const { t, language } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    disability_type: "none",
    language: "en",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isUrdu = language === "ur";

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(form);
      nav("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-aiden-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <Avatar size={105} expression="happy" className="drop-shadow-sm mb-2" />
          <h1 className="font-display text-3xl font-bold text-aiden-primary tracking-tight">
            {t("app_name")}
          </h1>
          <p className={`text-xs sm:text-sm text-aiden-text-secondary mt-1 max-w-xs ${isUrdu ? "font-urdu text-base" : ""}`}>
            {t("tagline")}
          </p>
        </div>

        <Card variant="standard" padding="lg" className="shadow-card border-aiden-border">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h2 className={`text-xl font-display font-bold text-aiden-text-primary ${isUrdu ? "font-urdu text-2xl" : ""}`}>
                {t("signup")}
              </h2>
              <p className="text-xs text-aiden-text-muted mt-0.5">
                {isUrdu ? "AIDEN میں اپنا نیا اکاؤنٹ بنائیں" : "Create an account to personalize your assistance"}
              </p>
            </div>

            {error && (
              <div className="bg-aiden-danger-light text-aiden-danger text-xs sm:text-sm p-3 rounded-aiden-md border border-aiden-danger/25 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-aiden-danger" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="name"
              label={t("name")}
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Abdullah"
            />

            <Input
              id="email"
              type="email"
              label={t("email")}
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />

            <Input
              id="password"
              type="password"
              label={t("password")}
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 6 characters"
            />

            <Select
              id="disability_type"
              label={t("i_am")}
              value={form.disability_type}
              onChange={(e) => update("disability_type", e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`role_${r}`)}
                </option>
              ))}
            </Select>

            <div>
              <label className="text-xs sm:text-sm font-medium text-aiden-text-secondary select-none mb-1.5 block">
                {t("language")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["en", "ur"].map((l) => {
                  const isSelected = form.language === l;
                  return (
                    <button
                      type="button"
                      key={l}
                      onClick={() => update("language", l)}
                      className={`py-2 px-3 rounded-aiden-md text-xs sm:text-sm font-medium border transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent ${
                        isSelected
                          ? "bg-aiden-primary text-white border-aiden-primary shadow-sm font-semibold"
                          : "bg-aiden-surface text-aiden-text-secondary border-aiden-border hover:bg-aiden-surface-secondary"
                      }`}
                    >
                      {l === "en" ? "English" : "اردو"}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={busy}
              className="w-full font-semibold shadow-sm mt-2"
            >
              {busy ? "Creating account…" : t("signup")}
            </Button>

            <p className="text-xs sm:text-sm text-center text-aiden-text-secondary pt-2 border-t border-aiden-border-subtle">
              {isUrdu ? "پہلے سے اکاؤنٹ ہے؟ " : "Already have an account? "}
              <Link to="/login" className="text-aiden-primary font-semibold hover:underline">
                {t("login")}
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

