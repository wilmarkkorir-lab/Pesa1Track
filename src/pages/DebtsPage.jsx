import { useEffect, useState } from "react";
import { api, getRows } from "../api/endpoints";
import CrudPage from "../components/CrudPage";
import { useAuth } from "../context/AuthContext";

const fields = [
  { key: "person_name", label: "Person" },
  { key: "debt_type", label: "Type", options: ["lent", "borrowed"] },
  { key: "original_amount", label: "Original amount", type: "number" },
  { key: "outstanding_amount", label: "Outstanding amount", type: "number" },
  { key: "due_date", label: "Due date", type: "date", required: false },
  { key: "status", label: "Status", options: ["open", "settled", "overdue"] },
  { key: "notes", label: "Notes", required: false },
];

function PaymentModal({ debt, onClose, onDone, fmt }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async e => {
    e.preventDefault();
    if (Number(amount) > parseFloat(debt.outstanding_amount)) {
      setErr(`Amount cannot exceed outstanding balance of ${fmt(debt.outstanding_amount)}.`); return;
    }
    setSaving(true); setErr("");
    try {
      await api.debtPayments(debt.id).create({ amount: Number(amount), paid_at: date, note });
      onDone();
    } catch (x) {
      const d = x?.response?.data;
      setErr(d ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" | ") : "Could not save.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Record payment — {debt.person_name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><i className="bi bi-x-lg" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-1">
          Type: <span className={`badge ${debt.debt_type === "lent" ? "badge-blue" : "badge-red"}`}>{debt.debt_type}</span>
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Outstanding: <b className="text-red-600">{fmt(debt.outstanding_amount)}</b>
        </p>
        {err && <p className="bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-3">{err}</p>}
        <form onSubmit={save} className="space-y-3">
          <label className="label">Payment amount
            <input required type="number" min="0.01" step="0.01" className="input mt-1" value={amount} onChange={e => setAmount(e.target.value)} />
          </label>
          <label className="label">Date
            <input required type="date" className="input mt-1" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <label className="label">Note (optional)
            <input type="text" className="input mt-1" value={note} onChange={e => setNote(e.target.value)} />
          </label>
          <div className="flex gap-3 pt-1">
            <button className="btn primary" disabled={saving}>
              {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : "Record payment"}
            </button>
            <button type="button" className="btn outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DebtCards({ reloadKey, onReload }) {
  const { user } = useAuth();
  const [debts, setDebts] = useState([]);
  const [paying, setPaying] = useState(null);
  const fmt = x => new Intl.NumberFormat(user?.currency === "USD" ? "en-US" : "en-KE", { style: "currency", currency: user?.currency || "KES" }).format(x || 0);

  const load = () => api.debts.list().then(r => setDebts(getRows(r))).catch(() => {});
  useEffect(() => { load(); }, [reloadKey]);

  if (!debts.length) return null;

  const open = debts.filter(d => d.status !== "settled");
  if (!open.length) return null;

  return (
    <>
      {paying && (
        <PaymentModal
          debt={paying} fmt={fmt}
          onClose={() => setPaying(null)}
          onDone={() => { setPaying(null); load(); onReload(); }}
        />
      )}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {open.map(d => {
          const pct = Math.min(100, Math.round(((parseFloat(d.original_amount) - parseFloat(d.outstanding_amount)) / parseFloat(d.original_amount)) * 100)) || 0;
          return (
            <div key={d.id} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold">{d.person_name}</p>
                  {d.due_date && <p className="text-xs text-slate-400 mt-0.5">Due: {d.due_date}</p>}
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${d.debt_type === "lent" ? "badge-blue" : "badge-red"}`}>{d.debt_type}</span>
                  <span className={`badge ${d.status === "overdue" ? "badge-red" : "badge-yellow"}`}>{d.status}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Paid off</span>
                <span className="font-bold">{pct}%</span>
              </div>
              <div className="progress-bar mb-3">
                <div className="progress-fill" style={{ width: `${pct}%`, background: "#3b82f6" }} />
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-500">Outstanding: <b className="text-red-600">{fmt(d.outstanding_amount)}</b></span>
                <span className="text-slate-500">Original: <b className="text-slate-700">{fmt(d.original_amount)}</b></span>
              </div>
              <button className="btn primary w-full" onClick={() => setPaying(d)}>
                <i className="bi bi-cash-coin mr-1" />Record payment
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function DebtsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <>
      <DebtCards reloadKey={reloadKey} onReload={() => setReloadKey(k => k + 1)} />
      <CrudPage key={reloadKey} title="Debts" service={api.debts} fields={fields} />
    </>
  );
}
