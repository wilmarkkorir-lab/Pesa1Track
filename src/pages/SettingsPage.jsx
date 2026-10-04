import { useEffect, useRef, useState } from "react";
import { auth } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { emit, on } from "../lib/events";

function Avatar({ user, size = "w-20 h-20", text = "text-3xl" }) {
  const [src, setSrc] = useState(() => localStorage.getItem("avatar"));
  useEffect(() => on("avatar:change", e => setSrc(e.detail)), []);
  if (src) return <img src={src} alt="avatar" className={`${size} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${size} rounded-full bg-emerald-600 flex items-center justify-center text-white font-black ${text} shrink-0`}>
      {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}

export { Avatar };

export default function SettingsPage() {
  const { user, load } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [avatarSrc, setAvatarSrc] = useState(() => localStorage.getItem("avatar") || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (user) setF({ full_name: user.full_name, currency: user.currency, timezone: user.timezone });
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleAvatar = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Image must be under 2MB.", "error"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      localStorage.setItem("avatar", src);
      setAvatarSrc(src);
      emit("avatar:change", src);
      setUploading(false);
      toast("Profile photo updated.");
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    localStorage.removeItem("avatar");
    setAvatarSrc(null);
    emit("avatar:change", null);
    toast("Profile photo removed.");
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await auth.updateMe(f);
      await load();
      toast("Settings saved successfully.");
    } catch (x) {
      const d = x?.response?.data;
      toast(d ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" | ") : "Could not save.", "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Avatar */}
      <div className="card p-6 mb-4">
        <h2 className="font-bold text-lg mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              : <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-3xl">
                  {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
            }
            <button type="button" onClick={() => fileRef.current.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-emerald-700">
              <i className="bi bi-camera text-xs" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">{user?.full_name}</p>
            <p className="text-slate-400 text-xs mb-3">JPG, PNG or GIF · Max 2MB</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current.click()}
                className="btn outline text-xs px-3 py-1.5" disabled={uploading}>
                {uploading ? <><span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-1 align-middle" />Uploading…</> : <><i className="bi bi-upload mr-1" />Upload photo</>}
              </button>
              {avatarSrc && (
                <button type="button" onClick={removeAvatar} className="btn outline text-xs px-3 py-1.5 text-red-500 border-red-200">
                  <i className="bi bi-trash mr-1" />Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
      </div>

      {/* Profile form */}
      <form onSubmit={save} className="card p-6 mb-4">
        <h2 className="font-bold text-lg mb-4">Profile</h2>
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
        <button className="btn primary" disabled={saving}>
          {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : "Save settings"}
        </button>
      </form>

      {/* Appearance */}
      <div className="card p-6 mb-4">
        <h2 className="font-bold text-lg mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Dark mode</p>
            <p className="text-slate-400 text-xs mt-0.5">Switch between light and dark theme</p>
          </div>
          <button type="button" onClick={() => setDark(d => !d)}
            className={`relative w-12 h-6 rounded-full transition-colors ${dark ? "bg-emerald-600" : "bg-slate-300"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-7" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-medium">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Currency</span><span className="badge badge-gray">{user?.currency}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Role</span><span className="badge badge-blue">{user?.is_staff ? "Admin" : "User"}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Email verified</span>
            {user?.email_verified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-yellow">Not verified</span>}
          </div>
          <div className="flex justify-between"><span className="text-slate-400">Member since</span><span className="font-medium">{user?.created_at?.slice(0,10)}</span></div>
        </div>
      </div>
    </div>
  );
}
