import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../api/endpoints";

const C = createContext(null);
export const useAuth = () => useContext(C);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    // Don't even attempt if there's no token — avoids 400/401 on cold load
    if (!localStorage.getItem("access")) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await auth.me();
      setUser(data);
    } catch {
      // Token invalid or expired and refresh failed — clear and treat as logged out
      setUser(null);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const signIn = async (email, password) => {
    const { data } = await auth.login({ username: email, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    await load();
  };

  const signOut = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return <C.Provider value={{ user, loading, load, signIn, signOut }}>{children}</C.Provider>;
}
