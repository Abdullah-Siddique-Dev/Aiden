import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import Avatar from "../components/Avatar";

const ROLES = ["deaf", "mute", "visually_impaired", "student", "caregiver", "teacher", "none"];

export default function Signup() {
  const { signup } = useAuth();
  const { t } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", disability_type: "none", language: "en" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

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
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Avatar size={100} expression="happy" />
          <h1 className="font-display text-2xl font-semibold mt-2">{t("app_name")}</h1>
        </div>
        <form onSubmit={onSubmit} className="bg-white rounded-card border hairline p-6 space-y-4">
          {error && <p className="text-rani text-sm">{error}</p>}
          <div>
            <label className="block text-sm mb-1">{t("name")}</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)}
              className="w-full border hairline rounded-card px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t("email")}</label>
            <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
              className="w-full border hairline rounded-card px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t("password")}</label>
            <input required type="password" minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)}
              className="w-full border hairline rounded-card px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t("i_am")}</label>
            <select value={form.disability_type} onChange={(e) => update("disability_type", e.target.value)}
              className="w-full border hairline rounded-card px-3 py-2 bg-white">
              {ROLES.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">{t("language")}</label>
            <div className="flex gap-2">
              {["en", "ur"].map((l) => (
                <button type="button" key={l} onClick={() => update("language", l)}
                  className={`flex-1 py-2 rounded-card border hairline ${form.language === l ? "bg-teal text-white" : "bg-white"}`}>
                  {l === "en" ? "English" : "اردو"}
                </button>
              ))}
            </div>
          </div>
          <button disabled={busy} className="w-full bg-marigold text-ink rounded-card py-2.5 font-medium hover:bg-marigold-dark transition-colors">
            {busy ? "…" : t("signup")}
          </button>
          <p className="text-sm text-center text-ink/60">
            <Link to="/login" className="text-teal font-medium">{t("login")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
