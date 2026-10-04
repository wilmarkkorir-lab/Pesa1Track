import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const WARN_BEFORE_MS = 2 * 60 * 1000; // warn 2 min before expiry

function getExpiry() {
  try {
    const token = localStorage.getItem("access");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch { return null; }
}

export default function SessionWarning() {
  const [show, setShow] = useState(false);
  const { signOut, load } = useAuth();
  const n = useNavigate();

  useEffect(() => {
    const check = () => {
      const exp = getExpiry();
      if (!exp) return;
      const remaining = exp - Date.now();
      if (remaining > 0 && remaining <= WARN_BEFORE_MS) setShow(true);
      else if (remaining <= 0) { signOut(); n("/login"); }
      else setShow(false);
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const extend = async () => {
    await load();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 text-sm font-medium">
      <i className="bi bi-clock-history text-lg" />
      <span>Your session is about to expire.</span>
      <button onClick={extend} className="bg-white text-amber-700 px-3 py-1 rounded-lg font-bold text-xs">Stay logged in</button>
      <button onClick={() => { signOut(); n("/login"); }} className="text-amber-200 hover:text-white text-xs">Log out</button>
    </div>
  );
}
