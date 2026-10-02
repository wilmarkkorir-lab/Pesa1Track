import { useEffect, useState } from "react";
import { auth } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, load } = useAuth();
  const [f, setF] = useState({});
  const [m, setM] = useState("");
  const [isErr, setIsErr] = useState(false);

  useEffect(() => { if (user) setF({ full_name: user.full_name, currency: user.currency, timezone: user.timezone }); }, [user]);

  const save = async e => {
    e.preventDefault();
    try {
      await auth.updateMe(f);
      await load();
      setIsErr(false); setM("Saved successfully.");
    } catch (x) {
      setIsErr(true);
      const d = x?.response?.data;
      setM(d ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" | ") : "Could not save.");
    }
  };

  return (
    <form onSubmit={save} className="card max-w-xl p-6">
      <h1 className="text-2xl font-bold mb-5">Settings</h1>
      <label className="label">Full name
        <input className="input mt-1" value={f.full_name || ""} onChange={e => setF({ ...f, full_name: e.target.value })} />
      </label>
      <label className="label">Currency
        <select className="input mt-1" value={f.currency || "KES"} onChange={e => setF({ ...f, currency: e.target.value })}>
          {["KES","USD","EUR","GBP","UGX","TZS","RWF","ETB","ZAR","NGN","GHS"].map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="label">Timezone
        <input className="input mt-1" value={f.timezone || ""} onChange={e => setF({ ...f, timezone: e.target.value })} />
      </label>
      <button className="btn primary">Save settings</button>
      {m && <p className={`mt-3 text-sm ${isErr ? "text-red-600" : "text-emerald-700"}`}>{m}</p>}
    </form>
  );
}
