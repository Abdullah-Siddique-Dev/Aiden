import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);
const API = "/api";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("aiden_token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (tok) => {
    try {
      const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tok}` } });
      if (!res.ok) throw new Error("not authed");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setToken(null);
      localStorage.removeItem("aiden_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchMe(token);
    else setLoading(false);
  }, [token, fetchMe]);

  async function login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("aiden_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Sign up failed");
    localStorage.setItem("aiden_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("aiden_token");
    setToken(null);
    setUser(null);
  }

  async function updateProfile(patch) {
    const res = await fetch(`${API}/auth/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
