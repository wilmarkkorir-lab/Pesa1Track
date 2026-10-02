import { useEffect, useState } from "react";
import ScreenshotImport from "../components/ScreenshotImport";
import { api, getRows } from "../api/endpoints";
import { exportCsv } from "../api/exportCsv";
import { parseMpesa } from "../api/parseMpesa";

function readError(x) {
  const d = x?.response?.data;
  if (!d) return "Request failed.";
  if (typeof d === "string") return d;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
}

function CategorySelect({ categories, value, onChange, filterType }) {
  const filtered = filterType ? categories.filter(c => c.transaction_type === filterType) : categories;
  return (
    <label className="label">Category
      <select className="input mt-1" value={value || ""} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}>
        <option value="">— Select category —</option>
        {filtered.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {filtered.length === 0 && (
        <p className="text-xs text-amber-600 mt-1"><i className="bi bi-exclamation-triangle mr-1" />No categories yet. <a href="/app/categories" className="underline font-semibold">Add one first</a></p>
      )}
    </label>
  );
}

// ── M-PESA SMS import ────────────────────────────────────────────────────────
function MpesaImport({ categories, onSaved }) {
  const [open, setOpen] = useState(false);
  const [sms, setSms] = useState("");
  const [parsed, setParsed] = useState(null);
  const [catId, setCatId] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => { setSms(""); setParsed(null); setStatus(null); setCatId(""); };

  const handleChange = e => {
    setSms(e.target.value); setStatus(null);
    const r = parseMpesa(e.target.value); setParsed(r);
    if (e.target.value && !r) setStatus({ ok: false, msg: "Could not recognise this M-PESA message." });
  };

  const save = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const payload = { transaction_type: parsed.transaction_type, amount: parsed.amount, transaction_date: parsed.transaction_date, payment_method: "mpesa", description: parsed.description };
      if (catId) payload.category = Number(catId);
      await api.transactions.create(payload);
      setStatus({ ok: true, msg: "Saved!" }); reset(); onSaved();
    } catch (x) { setStatus({ ok: false, msg: readError(x) }); }
    finally { setSaving(false); }
  };

  return (
    <div className="card mb-4 overflow-hidden">
      <button type="button" className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50" onClick={() => { setOpen(o => !o); reset(); }}>
        <span className="flex items-center gap-2 font-bold">
          <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><i className="bi bi-phone text-emerald-600" /></span>
          Import from M-PESA SMS
        </span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"} text-slate-400`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4">
          <textarea className="input mb-3" rows={3} placeholder="Paste M-PESA SMS here…" value={sms} onChange={handleChange} />
          {parsed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3">
              <p className="text-xs font-bold text-emerald-700 mb-2"><i className="bi bi-check-circle mr-1" />Detected</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div><p className="text-slate-400 text-xs">Type</p><span className={`badge ${parsed.transaction_type === "income" ? "badge-green" : "badge-red"}`}>{parsed.transaction_type}</span></div>
                <div><p className="text-slate-400 text-xs">Amount</p><p className="font-bold">Ksh {parsed.amount.toLocaleString()}</p></div>
                <div><p className="text-slate-400 text-xs">Date</p><p className="font-bold">{parsed.transaction_date}</p></div>
                <div><p className="text-slate-400 text-xs">Description</p><p className="font-bold truncate">{parsed.description}</p></div>
              </div>
              <CategorySelect categories={categories} value={catId} onChange={setCatId} filterType={parsed.transaction_type} />
              <div className="flex gap-2 mt-3">
                <button className="btn primary" onClick={save} disabled={saving}>
                  {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : "Save transaction"}
                </button>
                <button className="btn outline" onClick={reset}>Clear</button>
              </div>
            </div>
          )}
          {status && <p className={`text-sm p-3 rounded-xl ${status.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><i className={`bi ${status.ok ? "bi-check-circle" : "bi-exclamation-circle"} mr-1`} />{status.msg}</p>}
        </div>
      )}
    </div>
  );
}

// ── Main transactions table ───────────────────────────────────────────────────
function TransactionsTable({ categories, reloadKey, onReload }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [record, setRecord] = useState({ transaction_type: "expense", payment_method: "cash" });
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const load = () => {
    setLoading(true);
    api.transactions.list().then(r => setAll(getRows(r))).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [reloadKey]);

  const filtered = all.filter(t => {
    if (filterType && t.transaction_type !== filterType) return false;
    if (filterCat && String(t.category) !== filterCat) return false;
    if (filterFrom && t.transaction_date < filterFrom) return false;
    if (filterTo && t.transaction_date > filterTo) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.description?.toLowerCase().includes(q) && !String(t.amount).includes(q)) return false;
    }
    return true;
  });

  const openAdd = () => { setSelected(null); setRecord({ transaction_type: "expense", payment_method: "cash" }); setMessage(null); setFormOpen(true); };
  const cancel = () => { setFormOpen(false); setSelected(null); setRecord({ transaction_type: "expense", payment_method: "cash" }); setMessage(null); };

  const save = async e => {
    e.preventDefault(); setSaving(true);
    const payload = { ...record };
    if (!payload.category) delete payload.category;
    try {
      selected ? await api.transactions.update(selected.id, payload) : await api.transactions.create(payload);
      cancel(); setMessage({ ok: true, msg: "Saved successfully." }); load(); onReload();
    } catch (x) { setMessage({ ok: false, msg: readError(x) }); }
    finally { setSaving(false); }
  };

  const remove = async t => {
    if (!confirm("Delete this transaction?")) return;
    try { await api.transactions.remove(t.id); load(); }
    catch (x) { setMessage({ ok: false, msg: readError(x) }); }
  };

  const clearFilters = () => { setSearch(""); setFilterType(""); setFilterCat(""); setFilterFrom(""); setFilterTo(""); };
  const hasFilters = search || filterType || filterCat || filterFrom || filterTo;

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-slate-500 text-sm">{loading ? "Loading…" : `${filtered.length} of ${all.length} records`}</p>
        </div>
        <div className="flex gap-2">
          {!loading && filtered.length > 0 && <button className="btn outline" onClick={() => exportCsv("transactions.csv", filtered)}><i className="bi bi-download mr-1" />Export CSV</button>}
          {!formOpen && <button className="btn primary" onClick={openAdd}><i className="bi bi-plus-lg mr-1" />Add Transaction</button>}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <p className="text-xs font-bold text-slate-500 mb-1">SEARCH</p>
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input className="input pl-8" placeholder="Description or amount…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">TYPE</p>
            <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">CATEGORY</p>
            <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">FROM</p>
            <input type="date" className="input" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          </div>
        </div>
        {hasFilters && <button className="mt-3 text-sm text-emerald-600 font-semibold" onClick={clearFilters}><i className="bi bi-x-circle mr-1" />Clear filters</button>}
      </div>

      {message && (
        <p className={`mb-4 text-sm p-3 rounded-xl ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          <i className={`bi ${message.ok ? "bi-check-circle" : "bi-exclamation-circle"} mr-2`} />{message.msg}
        </p>
      )}

      {/* Form */}
      {formOpen && (
        <div className="card p-5 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">{selected ? "Edit Transaction" : "New Transaction"}</h2>
            <button type="button" onClick={cancel} className="text-slate-400 hover:text-slate-700"><i className="bi bi-x-lg" /></button>
          </div>
          <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
            {/* Type */}
            <label className="label">Type
              <div className="flex gap-2 mt-1">
                {["expense", "income"].map(t => (
                  <button type="button" key={t} onClick={() => setRecord({ ...record, transaction_type: t, category: null })}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-colors ${record.transaction_type === t ? (t === "expense" ? "bg-red-500 text-white border-red-500" : "bg-emerald-600 text-white border-emerald-600") : "bg-white border-slate-200 text-slate-500"}`}>
                    <i className={`bi ${t === "expense" ? "bi-arrow-up-right" : "bi-arrow-down-left"} mr-1`} />{t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </label>
            {/* Category */}
            <CategorySelect categories={categories} value={record.category} onChange={v => setRecord({ ...record, category: v })} />
            {/* Amount */}
            <label className="label">Amount
              <input required type="number" min="0.01" step="0.01" className="input mt-1" placeholder="0.00" value={record.amount || ""} onChange={e => setRecord({ ...record, amount: e.target.value })} />
            </label>
            {/* Date */}
            <label className="label">Date
              <input required type="date" className="input mt-1" value={record.transaction_date || ""} onChange={e => setRecord({ ...record, transaction_date: e.target.value })} />
            </label>
            {/* Payment method */}
            <label className="label">Payment Method
              <select className="input mt-1" value={record.payment_method || "cash"} onChange={e => setRecord({ ...record, payment_method: e.target.value })}>
                {["cash", "mpesa", "bank", "card", "other"].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </label>
            {/* Description */}
            <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span>
              <input className="input mt-1" placeholder="e.g. Bought groceries at Naivas" value={record.description || ""} onChange={e => setRecord({ ...record, description: e.target.value })} />
            </label>
            <div className="md:col-span-2 flex gap-3">
              <button className="btn primary" disabled={saving}>
                {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : (selected ? "Update" : "Save")}
              </button>
              <button type="button" className="btn outline" onClick={cancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <i className="bi bi-inbox text-5xl block mb-3" />
            <p className="font-semibold">{hasFilters ? "No transactions match your filters." : "No transactions yet."}</p>
            {hasFilters ? <button className="btn outline mt-4" onClick={clearFilters}>Clear filters</button> : <button className="btn primary mt-4" onClick={openAdd}>Add your first one</button>}
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Type</th><th>Method</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(t => {
                const cat = catMap[t.category];
                return (
                  <tr key={t.id}>
                    <td className="font-medium">{t.description || "—"}</td>
                    <td>
                      {cat ? (
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: cat.color || "#059669" }}>
                            <i className={`bi ${cat.icon || "bi-tag"}`} />
                          </span>
                          <span className="text-sm font-medium">{cat.name}</span>
                        </span>
                      ) : <span className="text-slate-400 text-sm">—</span>}
                    </td>
                    <td className="text-slate-500 text-sm">{t.transaction_date}</td>
                    <td><span className={`badge ${t.transaction_type === "income" ? "badge-green" : "badge-red"}`}>{t.transaction_type}</span></td>
                    <td><span className="badge badge-gray">{t.payment_method}</span></td>
                    <td className={`font-bold ${t.transaction_type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.transaction_type === "income" ? "+" : "-"}Ksh {Number(t.amount).toLocaleString()}
                    </td>
                    <td>
                      <button className="text-emerald-700 hover:text-emerald-900 mr-4" onClick={() => { setSelected(t); setRecord({ ...t }); setMessage(null); setFormOpen(true); }}><i className="bi bi-pencil" /></button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => remove(t)}><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [categories, setCategories] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.categories.list().then(r => setCategories(getRows(r))).catch(() => {});
  }, []);

  const reload = () => setReloadKey(k => k + 1);

  return (
    <>
      <MpesaImport categories={categories} onSaved={reload} />
      <ScreenshotImport onSaved={reload} />
      <TransactionsTable categories={categories} reloadKey={reloadKey} onReload={reload} />
    </>
  );
}
