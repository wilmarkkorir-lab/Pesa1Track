import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../api/endpoints";

const C = createContext(null);
export const useAuth = () => useContext(C);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    if (!access && !refresh) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await auth.me();
      setUser(data);
    } catch (e) {
      if (e.response?.status === 401 && refresh) {
        try {
          const { data } = await auth.refresh({ refresh });
          localStorage.setItem("access", data.access);
          const { data: me } = await auth.me();
          setUser(me);
        } catch {
          setUser(null);
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
      } else {
        setUser(null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      }
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
