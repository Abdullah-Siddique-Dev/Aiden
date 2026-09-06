import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import Avatar from "../components/Avatar";

export default function Login() {
  const { login } = useAuth();
  const { t } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Avatar size={110} expression="encouraging" />
          <h1 className="font-display text-3xl font-semibold mt-2">{t("app_name")}</h1>
          <p className="text-ink/60 text-center text-sm mt-1">{t("tagline")}</p>
        </div>
        <form onSubmit={onSubmit} className="bg-white rounded-card border hairline p-6 space-y-4">
          <h2 className="text-xl font-display font-semibold">{t("welcome_back")}</h2>
          {error && <p className="text-rani text-sm">{error}</p>}
          <div>
            <label className="block text-sm mb-1" htmlFor="email">{t("email")}</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border hairline rounded-card px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">{t("password")}</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border hairline rounded-card px-3 py-2" />
          </div>
          <button disabled={busy} className="w-full bg-teal text-white rounded-card py-2.5 font-medium hover:bg-teal-dark transition-colors">
            {busy ? "…" : t("login")}
          </button>
          <p className="text-sm text-center text-ink/60">
            No account? <Link to="/signup" className="text-teal font-medium">{t("signup")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
