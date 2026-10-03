import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

function readError(x) {
  const d = x?.response?.data;
  if (!d) return "Request failed. Check your connection.";
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  if (d.non_field_errors) return Array.isArray(d.non_field_errors) ? d.non_field_errors.join(" ") : d.non_field_errors;
  // Map Django field names to friendly labels
  const labels = { username: "Email", email: "Email", password: "Password", full_name: "Full name", currency: "Currency" };
  return Object.entries(d)
    .map(([k, v]) => `${labels[k] || k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" | ");
}

export default function AuthPages({ register = false }) {
  const [f, setF] = useState({ full_name: "", email: "", password: "", currency: "KES" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const n = useNavigate();

  // Already logged in — skip login page
  useEffect(() => { if (user) n("/app", { replace: true }); }, [user]);

  const submit = async e => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      if (register) await auth.register({ full_name: f.full_name, email: f.email, username: f.email, password: f.password, currency: f.currency });
      await signIn(f.email, f.password);
      n("/app");
    } catch (x) { setErr(readError(x)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <form onSubmit={submit} className="card p-7 w-full max-w-md">
        <Link to="/" className="font-black text-xl flex items-center gap-2">
          <i className="bi bi-wallet2 text-emerald-600" />PesaTrack
        </Link>
        <h1 className="text-2xl font-bold mt-6 mb-1">{register ? "Create your account" : "Welcome back"}</h1>
        <p className="text-slate-500 text-sm mb-5">{register ? "Start tracking your finances today." : "Sign in to your account."}</p>

        {err && (
          <div className="bg-red-50 text-red-700 p-3 mb-4 rounded-xl text-sm flex gap-2">
            <i className="bi bi-exclamation-circle mt-0.5 shrink-0" />{err}
          </div>
        )}

        {register && (
          <label className="label">Full name
            <input required className="input mt-1" placeholder="John Doe" onChange={e => setF({ ...f, full_name: e.target.value })} />
          </label>
        )}
        <label className="label">Email address
          <input required type="email" className="input mt-1" placeholder="you@example.com" onChange={e => setF({ ...f, email: e.target.value })} />
        </label>
        <label className="label">Password
          <input required type="password" className="input mt-1" placeholder={register ? "Min. 8 characters" : "••••••••"} onChange={e => setF({ ...f, password: e.target.value })} />
        </label>
        {register && (
          <label className="label">Currency
            <select className="input mt-1" onChange={e => setF({ ...f, currency: e.target.value })}>
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </label>
        )}

        <button className="btn primary w-full mt-2" disabled={loading}>
          {loading
            ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />{register ? "Creating account…" : "Signing in…"}</>
            : register ? "Create account" : "Sign in"}
        </button>

        <p className="text-center text-sm mt-5 text-slate-500">
          {register ? "Already have an account? " : "Don't have an account? "}
          <Link className="text-emerald-700 font-semibold" to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create one"}
          </Link>
        </p>
      </form>
    </div>
  );
}
