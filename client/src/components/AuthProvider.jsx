import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthCtx = createContext(null);

// Hook for consuming auth context
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : null;
  });

  // Save user + token to localStorage and state
  function setSession({ user, accessToken }) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }

  // Clear session (logout)
  function clearSession() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  // Auth actions
  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    setSession(data);
    return data.user;
  }

  async function register(name, email, password, role = "STUDENT") {
    const { data } = await api.post("/api/auth/register", { name, email, password, role });
    setSession(data);
    return data.user;
  }

  function logout() {
    clearSession();
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || user) return;
    api
      .get("/api/auth/me")
      .then(({ data }) => {
        const u = { id: data.user.sub, email: data.user.email, role: data.user.role };
        localStorage.setItem("user", JSON.stringify(u));
        setUser(u);
      })
      .catch(() => clearSession());
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
