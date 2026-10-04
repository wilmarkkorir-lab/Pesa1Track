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
  const labels = { username: "Email", email: "Email", password: "Password", full_name: "Full name", currency: "Currency" };
  return Object.entries(d).map(([k, v]) => `${labels[k] || k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
}

function PasswordInput({ placeholder, value, onChange, required }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        required={required}
        type={show ? "text" : "password"}
        className="input mt-1 pr-10"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button type="button" tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 mt-0.5"
        onClick={() => setShow(s => !s)}>
        <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
      </button>
    </div>
  );
}

export default function AuthPages({ register = false }) {
  const [f, setF] = useState({ full_name: "", email: "", password: "", confirm: "", currency: "KES" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const n = useNavigate();

  useEffect(() => { if (user) n("/app", { replace: true }); }, [user]);

  const submit = async e => {
    e.preventDefault();
    setErr("");
    if (register && f.password !== f.confirm) { setErr("Passwords do not match."); return; }
    if (register && f.password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setLoading(true);
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
            <input required className="input mt-1" placeholder="John Doe"
              value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          </label>
        )}

        <label className="label">Email address
          <input required type="email" className="input mt-1" placeholder="you@example.com"
            value={f.email}
            onChange={e => setF({ ...f, email: e.target.value })}
            onBlur={e => { if (e.target.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) setErr("Please enter a valid email address."); else if (err === "Please enter a valid email address.") setErr(""); }}
          />
        </label>

        <label className="label">Password
          <PasswordInput
            required placeholder={register ? "Min. 8 characters" : "••••••••"}
            value={f.password} onChange={e => setF({ ...f, password: e.target.value })}
          />
        </label>

        {register && (
          <>
            <label className="label">Confirm password
              <PasswordInput
                required placeholder="Re-enter your password"
                value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })}
              />
              {f.confirm && f.password !== f.confirm && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
              )}
              {f.confirm && f.password === f.confirm && f.confirm.length > 0 && (
                <p className="text-emerald-600 text-xs mt-1"><i className="bi bi-check-circle mr-1" />Passwords match.</p>
              )}
            </label>

            <label className="label">Currency
              <select className="input mt-1" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </label>

            {register && f.password && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">Password strength</p>
                <div className="flex gap-1">
                  {[8, 10, 12, 16].map((len, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${f.password.length >= len ? ["bg-red-400","bg-yellow-400","bg-blue-400","bg-emerald-500"][i] : "bg-slate-200"}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {f.password.length < 8 ? "Too short" : f.password.length < 10 ? "Weak" : f.password.length < 12 ? "Fair" : f.password.length < 16 ? "Good" : "Strong"}
                </p>
              </div>
            )}
          </>
        )}

        <button className="btn primary w-full mt-2" disabled={loading || (register && f.password !== f.confirm && f.confirm.length > 0)}>
          {loading
            ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />{register ? "Creating account…" : "Signing in…"}</>
            : register ? "Create account" : "Sign in"}
        </button>

        {!register && (
          <p className="text-center text-xs mt-3 text-slate-400">
            Forgot your password? Contact support.
          </p>
        )}

        <p className="text-center text-sm mt-4 text-slate-500">
          {register ? "Already have an account? " : "Don't have an account? "}
          <Link className="text-emerald-700 font-semibold" to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create one"}
          </Link>
        </p>
      </form>
    </div>
  );
}
