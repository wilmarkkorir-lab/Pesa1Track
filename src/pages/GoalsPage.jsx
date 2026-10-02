import { useEffect, useState } from "react";
import { api, getRows } from "../api/endpoints";
import CrudPage from "../components/CrudPage";
import { useAuth } from "../context/AuthContext";

const fields = [
  { key: "name", label: "Name" },
  { key: "target_amount", label: "Target amount", type: "number" },
  { key: "target_date", label: "Target date", type: "date", required: false },
  { key: "status", label: "Status", options: ["active", "completed", "cancelled"] },
];

function ContributeModal({ goal, onClose, onDone, fmt }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async e => {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api.goalContributions(goal.id).create({ amount: Number(amount), contributed_at: date, note });
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
          <h2 className="font-bold text-lg">Add contribution — {goal.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><i className="bi bi-x-lg" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Current: <b>{fmt(goal.current_amount)}</b> / Target: <b>{fmt(goal.target_amount)}</b>
        </p>
        {err && <p className="bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-3">{err}</p>}
        <form onSubmit={save} className="space-y-3">
          <label className="label">Amount
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
              {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : "Save contribution"}
            </button>
            <button type="button" className="btn outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GoalCards({ reloadKey, onReload }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [contributing, setContributing] = useState(null);
  const fmt = x => new Intl.NumberFormat(user?.currency === "USD" ? "en-US" : "en-KE", { style: "currency", currency: user?.currency || "KES" }).format(x || 0);

  const load = () => api.goals.list().then(r => setGoals(getRows(r))).catch(() => {});
  useEffect(() => { load(); }, [reloadKey]);

  if (!goals.length) return null;

  return (
    <>
      {contributing && (
        <ContributeModal
          goal={contributing} fmt={fmt}
          onClose={() => setContributing(null)}
          onDone={() => { setContributing(null); load(); onReload(); }}
        />
      )}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {goals.map(g => {
          const pct = Math.min(100, Math.round((parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100)) || 0;
          const statusCls = g.status === "completed" ? "badge-green" : g.status === "cancelled" ? "badge-red" : "badge-blue";
          return (
            <div key={g.id} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold">{g.name}</p>
                  {g.target_date && <p className="text-xs text-slate-400 mt-0.5">Target: {g.target_date}</p>}
                </div>
                <span className={`badge ${statusCls}`}>{g.status}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold">{pct}%</span>
              </div>
              <div className="progress-bar mb-3">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-500">Saved: <b className="text-slate-700">{fmt(g.current_amount)}</b></span>
                <span className="text-slate-500">Goal: <b className="text-slate-700">{fmt(g.target_amount)}</b></span>
              </div>
              {g.status === "active" && (
                <button className="btn primary w-full" onClick={() => setContributing(g)}>
                  <i className="bi bi-plus-lg mr-1" />Add contribution
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function GoalsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <>
      <GoalCards reloadKey={reloadKey} onReload={() => setReloadKey(k => k + 1)} />
      <CrudPage key={reloadKey} title="Savings goals" service={api.goals} fields={fields} />
    </>
  );
}
