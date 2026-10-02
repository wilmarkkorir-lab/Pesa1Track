import { useEffect, useState } from "react";
import { api, getRows } from "../api/endpoints";

const PRESETS = [
  { name: "Food & Groceries", transaction_type: "expense", icon: "bi-cart3", color: "#f97316" },
  { name: "Transport", transaction_type: "expense", icon: "bi-car-front", color: "#3b82f6" },
  { name: "Rent", transaction_type: "expense", icon: "bi-house", color: "#8b5cf6" },
  { name: "Utilities", transaction_type: "expense", icon: "bi-lightning", color: "#f59e0b" },
  { name: "Entertainment", transaction_type: "expense", icon: "bi-film", color: "#ec4899" },
  { name: "Health", transaction_type: "expense", icon: "bi-heart-pulse", color: "#ef4444" },
  { name: "Education", transaction_type: "expense", icon: "bi-book", color: "#14b8a6" },
  { name: "Clothing", transaction_type: "expense", icon: "bi-bag", color: "#a855f7" },
  { name: "Salary", transaction_type: "income", icon: "bi-briefcase", color: "#059669" },
  { name: "Business", transaction_type: "income", icon: "bi-shop", color: "#10b981" },
  { name: "Freelance", transaction_type: "income", icon: "bi-laptop", color: "#06b6d4" },
  { name: "Investment", transaction_type: "income", icon: "bi-graph-up", color: "#6366f1" },
];

const ICONS = [
  "bi-tag","bi-cart3","bi-car-front","bi-house","bi-lightning","bi-film","bi-heart-pulse",
  "bi-book","bi-bag","bi-briefcase","bi-shop","bi-laptop","bi-graph-up","bi-phone",
  "bi-cup-hot","bi-airplane","bi-music-note","bi-controller","bi-scissors","bi-wrench",
  "bi-gift","bi-piggy-bank","bi-cash-coin","bi-bank",
];
const COLORS = ["#ef4444","#f97316","#f59e0b","#059669","#10b981","#14b8a6","#3b82f6","#6366f1","#8b5cf6","#ec4899","#64748b","#0f172a"];

function readError(x) {
  const d = x?.response?.data;
  if (!d) return "Request failed.";
  if (typeof d === "string") return d;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
}

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [record, setRecord] = useState({ name: "", transaction_type: "expense", icon: "bi-tag", color: "#059669" });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("expense");

  const load = () => {
    setLoading(true);
    api.categories.list().then(r => setItems(getRows(r))).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = (preset = null) => {
    setSelected(null);
    setRecord(preset || { name: "", transaction_type: "expense", icon: "bi-tag", color: "#059669" });
    setMessage(null);
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const edit = x => { setSelected(x); setRecord(x); setMessage(null); setOpen(true); };
  const cancel = () => { setOpen(false); setSelected(null); setRecord({ name: "", transaction_type: "expense", icon: "bi-tag", color: "#059669" }); setMessage(null); };

  const save = async e => {
    e.preventDefault(); setSaving(true);
    try {
      selected ? await api.categories.update(selected.id, record) : await api.categories.create(record);
      cancel(); load(); setMessage({ ok: true, msg: "Category saved!" });
    } catch (x) { setMessage({ ok: false, msg: readError(x) }); }
    finally { setSaving(false); }
  };

  const remove = async x => {
    if (!confirm("Delete this category?")) return;
    try { await api.categories.remove(x.id); load(); }
    catch { setMessage({ ok: false, msg: "Cannot delete — it may be used by transactions." }); }
  };

  const existing = new Set(items.map(i => i.name));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-slate-500 text-sm">{loading ? "Loading…" : `${items.length} categor${items.length !== 1 ? "ies" : "y"}`}</p>
        </div>
        {!open && <button className="btn primary" onClick={() => openAdd()}><i className="bi bi-plus-lg mr-1" />New Category</button>}
      </div>

      {message && (
        <p className={`mb-4 text-sm p-3 rounded-xl ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          <i className={`bi ${message.ok ? "bi-check-circle" : "bi-exclamation-circle"} mr-2`} />{message.msg}
        </p>
      )}

      {/* Form */}
      {open && (
        <div className="card p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">{selected ? "Edit Category" : "New Category"}</h2>
            <button onClick={cancel} className="text-slate-400 hover:text-slate-700"><i className="bi bi-x-lg" /></button>
          </div>
          <form onSubmit={save}>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Name */}
              <label className="label">Category Name
                <input required className="input mt-1" placeholder="e.g. Food, Transport, Salary" value={record.name} onChange={e => setRecord({ ...record, name: e.target.value })} />
              </label>
              {/* Type */}
              <label className="label">Type
                <div className="flex gap-2 mt-1">
                  {["expense", "income"].map(t => (
                    <button type="button" key={t} onClick={() => setRecord({ ...record, transaction_type: t })}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-colors ${record.transaction_type === t ? (t === "expense" ? "bg-red-500 text-white border-red-500" : "bg-emerald-600 text-white border-emerald-600") : "bg-white border-slate-200 text-slate-500"}`}>
                      <i className={`bi ${t === "expense" ? "bi-arrow-up-right" : "bi-arrow-down-left"} mr-1`} />{t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </label>
              {/* Icon */}
              <label className="label">Icon
                <div className="flex gap-2 mt-1 flex-wrap">
                  {ICONS.map(ic => (
                    <button type="button" key={ic} onClick={() => setRecord({ ...record, icon: ic })}
                      style={{ background: record.icon === ic ? record.color : "#f1f5f9" }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${record.icon === ic ? "text-white scale-110" : "text-slate-500"}`}>
                      <i className={`bi ${ic}`} />
                    </button>
                  ))}
                </div>
              </label>
              {/* Color */}
              <label className="label">Color
                <div className="flex gap-2 mt-1 flex-wrap">
                  {COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setRecord({ ...record, color: c })}
                      style={{ background: c }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${record.color === c ? "border-slate-800 scale-110" : "border-transparent"}`} />
                  ))}
                </div>
              </label>
              {/* Preview */}
              <label className="label">Preview
                <div className="mt-1 flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg" style={{ background: record.color }}>
                    <i className={`bi ${record.icon}`} />
                  </span>
                  <div>
                    <p className="font-bold text-sm">{record.name || "Category name"}</p>
                    <span className={`badge ${record.transaction_type === "income" ? "badge-green" : "badge-red"}`}>{record.transaction_type}</span>
                  </div>
                </div>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn primary" disabled={saving}>
                {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : (selected ? "Update" : "Save")}
              </button>
              <button type="button" className="btn outline" onClick={cancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Quick add presets */}
      {!open && (
        <div className="card p-5 mb-6">
          <p className="font-bold mb-1">Quick Add</p>
          <p className="text-slate-500 text-sm mb-4">Tap any suggestion to add it instantly</p>
          <div className="flex gap-2 mb-3">
            {["expense", "income"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${tab === t ? (t === "expense" ? "bg-red-500 text-white border-red-500" : "bg-emerald-600 text-white border-emerald-600") : "bg-white border-slate-200 text-slate-500"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter(p => p.transaction_type === tab && !existing.has(p.name)).map(p => (
              <button key={p.name} onClick={() => openAdd(p)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors text-sm">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: p.color }}>
                  <i className={`bi ${p.icon}`} />
                </span>
                {p.name}
              </button>
            ))}
            {PRESETS.filter(p => p.transaction_type === tab && !existing.has(p.name)).length === 0 && (
              <p className="text-slate-400 text-sm">All suggestions already added!</p>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <i className="bi bi-tags text-5xl block mb-3" />
            <p className="font-semibold">No categories yet.</p>
            <p className="text-sm mt-1">Use the quick add above or create a custom one.</p>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Category</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(x => (
                <tr key={x.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0" style={{ background: x.color || "#059669" }}>
                        <i className={`bi ${x.icon || "bi-tag"}`} />
                      </span>
                      <span className="font-medium">{x.name}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${x.transaction_type === "income" ? "badge-green" : "badge-red"}`}>{x.transaction_type}</span></td>
                  <td>
                    <button className="text-emerald-700 hover:text-emerald-900 mr-4" onClick={() => edit(x)}><i className="bi bi-pencil" /></button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => remove(x)}><i className="bi bi-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
