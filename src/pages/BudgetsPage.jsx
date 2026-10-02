import { useEffect, useState } from "react";
import { api, getRows } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

function readError(x) {
  const d = x?.response?.data;
  if (!d) return "Request failed.";
  if (typeof d === "string") return d;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function BudgetsPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [limit, setLimit] = useState("");
  const [catLimits, setCatLimits] = useState({}); // { catId: amount }

  const fmt = x => new Intl.NumberFormat("en-KE", { style: "currency", currency: user?.currency || "KES", maximumFractionDigits: 0 }).format(x || 0);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.budgets.list().then(r => setBudgets(getRows(r))),
      api.transactions.list().then(r => setTransactions(getRows(r))),
      api.categories.list().then(r => setCategories(getRows(r))),
    ]).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setSelected(null);
    setSelYear(now.getFullYear()); setSelMonth(now.getMonth());
    setLimit(""); setCatLimits({}); setMessage(null); setOpen(true);
  };
  const edit = b => {
    setSelected(b);
    const [y, m] = b.month.split('-');
    setSelYear(Number(y)); setSelMonth(Number(m) - 1);
    setLimit(b.total_limit); setCatLimits(b.catLimits || {}); setMessage(null); setOpen(true);
  };
  const cancel = () => { setOpen(false); setSelected(null); setCatLimits({}); setMessage(null); };

  const save = async e => {
    e.preventDefault(); setSaving(true);
    const mm = String(selMonth + 1).padStart(2, "0");
    const payload = { month: `${selYear}-${mm}-01`, total_limit: Number(limit) };
    try {
      if (selected) {
        await api.budgets.update(selected.id, payload);
      } else {
        // Check if budget for this month already exists
        const existing = budgets.find(b => b.month?.slice(0, 7) === `${selYear}-${mm}`);
        if (existing) {
          await api.budgets.update(existing.id, payload);
        } else {
          await api.budgets.create(payload);
        }
      }
      cancel(); load(); setMessage({ ok: true, msg: "Budget saved!" });
    } catch (x) { setMessage({ ok: false, msg: readError(x) }); }
    finally { setSaving(false); }
  };

  const remove = async b => {
    if (!confirm("Delete this budget?")) return;
    try { await api.budgets.remove(b.id); load(); }
    catch { setMessage({ ok: false, msg: "Could not delete." }); }
  };

  const getSpent = (b, catId = null) => {
    const m = b.month?.slice(0, 7);
    return transactions
      .filter(t => t.transaction_type === "expense" && t.transaction_date?.startsWith(m) && (catId === null || t.category === catId))
      .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-slate-500 text-sm">Set monthly spending limits and track how you're doing</p>
        </div>
        {!open && <button className="btn primary" onClick={openAdd}><i className="bi bi-plus-lg mr-1" />New Budget</button>}
      </div>

      {message && (
        <p className={`mb-4 text-sm p-3 rounded-xl ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          <i className={`bi ${message.ok ? "bi-check-circle" : "bi-exclamation-circle"} mr-2`} />{message.msg}
        </p>
      )}

      {/* Form */}
      {open && (
        <div className="card p-5 mb-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg">{selected ? "Edit Budget" : "New Budget"}</h2>
            <button onClick={cancel} className="text-slate-400 hover:text-slate-700"><i className="bi bi-x-lg" /></button>
          </div>
          <form onSubmit={save}>
            {/* Month picker */}
            <label className="label">Budget Month
              <input required type="date" className="input mt-1" value={`${selYear}-${String(selMonth+1).padStart(2,'0')}-01`} onChange={e => { const [y,m] = e.target.value.split('-'); setSelYear(Number(y)); setSelMonth(Number(m)-1); }} />
            </label>
            <div className="bg-emerald-50 rounded-xl px-4 py-2 mb-4 text-emerald-700 font-semibold text-sm">
              <i className="bi bi-calendar3 mr-2" />Budget for: {MONTH_NAMES[selMonth]} {selYear}
            </div>

            {/* Total limit */}
            <label className="label">Overall Monthly Limit ({user?.currency || "KES"})
              <input required type="number" min="1" className="input mt-1" placeholder="e.g. 50000" value={limit} onChange={e => setLimit(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Total maximum spending for the month</p>
            </label>

            {/* Per-category limits */}
            {categories.filter(c => c.transaction_type === "expense").length > 0 && (
              <div className="mt-4">
                <p className="label mb-3">Category Limits <span className="text-slate-400 font-normal">(optional — set how much per category)</span></p>
                <div className="space-y-2">
                  {categories.filter(c => c.transaction_type === "expense").map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: c.color || "#059669" }}>
                        <i className={`bi ${c.icon || "bi-tag"}`} />
                      </span>
                      <span className="text-sm font-medium w-36 shrink-0">{c.name}</span>
                      <input
                        type="number" min="0" placeholder="No limit"
                        className="input"
                        value={catLimits[c.id] || ""}
                        onChange={e => setCatLimits({ ...catLimits, [c.id]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button className="btn primary" disabled={saving}>
                {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : (selected ? "Update Budget" : "Save Budget")}
              </button>
              <button type="button" className="btn outline" onClick={cancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="py-16"><div className="spinner" /></div>
      ) : budgets.length === 0 ? (
        <div className="card py-16 text-center text-slate-400">
          <i className="bi bi-pie-chart text-5xl block mb-3" />
          <p className="font-semibold text-lg">No budgets yet</p>
          <p className="text-sm mt-1 mb-4">Create a budget to track your monthly spending</p>
          <button className="btn primary" onClick={openAdd}><i className="bi bi-plus-lg mr-1" />Create your first budget</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map(b => {
            const spent = getSpent(b);
            const lim = parseFloat(b.total_limit || 0);
            const pct = lim > 0 ? Math.min(100, Math.round((spent / lim) * 100)) : 0;
            const over = spent > lim;
            const remaining = lim - spent;
            const [y, m] = b.month.split('-');
            const label = `${MONTH_NAMES[Number(m) - 1]} ${y}`;
            const expCats = categories.filter(c => c.transaction_type === "expense");

            return (
              <div key={b.id} className="card p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-xl">{label}</p>
                    <p className="text-slate-500 text-sm">Monthly budget</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${over ? "badge-red" : pct > 80 ? "badge-yellow" : "badge-green"}`}>
                      {over ? "Over budget!" : pct > 80 ? "Almost full" : `${pct}% used`}
                    </span>
                    <button className="text-emerald-700 hover:text-emerald-900" onClick={() => edit(b)}><i className="bi bi-pencil" /></button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => remove(b)}><i className="bi bi-trash" /></button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar mb-1">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: over ? "#dc2626" : pct > 80 ? "#d97706" : "#059669" }} />
                </div>
                <p className="text-xs text-slate-400 mb-4">{pct}% of budget used</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Spent</p>
                    <p className={`font-bold text-sm ${over ? "text-red-600" : "text-slate-700"}`}>{fmt(spent)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Budget</p>
                    <p className="font-bold text-sm text-slate-700">{fmt(lim)}</p>
                  </div>
                  <div className={`${remaining < 0 ? "bg-red-50" : "bg-emerald-50"} rounded-xl p-3`}>
                    <p className="text-xs text-slate-500 mb-1">Remaining</p>
                    <p className={`font-bold text-sm ${remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {remaining < 0 ? `-${fmt(Math.abs(remaining))}` : fmt(remaining)}
                    </p>
                  </div>
                </div>

                {/* Per-category breakdown */}
                {expCats.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 mb-3">SPENDING BY CATEGORY</p>
                    <div className="space-y-3">
                      {expCats.map(c => {
                        const catSpent = getSpent(b, c.id);
                        const catLimit = parseFloat(b.catLimits?.[c.id] || 0);
                        if (catSpent === 0 && !catLimit) return null;
                        const base = catLimit || lim;
                        const catPct = base > 0 ? Math.min(100, Math.round((catSpent / base) * 100)) : 0;
                        const catOver = catLimit > 0 && catSpent > catLimit;
                        return (
                          <div key={c.id}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="flex items-center gap-2 text-sm">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: c.color || "#059669" }}>
                                  <i className={`bi ${c.icon || "bi-tag"}`} />
                                </span>
                                <span className="font-medium">{c.name}</span>
                              </span>
                              <span className="text-sm">
                                <span className={`font-bold ${catOver ? "text-red-600" : "text-slate-700"}`}>{fmt(catSpent)}</span>
                                {catLimit > 0 && <span className="text-slate-400"> / {fmt(catLimit)}</span>}
                              </span>
                            </div>
                            <div className="progress-bar" style={{ height: 6 }}>
                              <div className="progress-fill" style={{ width: `${catPct}%`, background: catOver ? "#dc2626" : c.color || "#059669" }} />
                            </div>
                            {catOver && <p className="text-xs text-red-500 mt-0.5">Over limit by {fmt(catSpent - catLimit)}</p>}
                          </div>
                        );
                      })}
                      {expCats.every(c => getSpent(b, c.id) === 0 && !b.catLimits?.[c.id]) && (
                        <p className="text-xs text-slate-400">No categorised expenses this month yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
