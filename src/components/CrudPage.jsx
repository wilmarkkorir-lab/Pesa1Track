import { useEffect, useState } from "react";
import { getRows } from "../api/endpoints";
import { exportCsv } from "../api/exportCsv";
import Field from "./Field";

function readError(x) {
  const d = x?.response?.data;
  if (!d) return "Request failed.";
  if (typeof d === "string") return d;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
}

function Badge({ value }) {
  const v = String(value ?? "").toLowerCase();
  const cls =
    ["active", "paid", "settled", "completed", "income"].includes(v) ? "badge-green" :
    ["overdue", "expense", "borrowed"].includes(v) ? "badge-red" :
    ["unpaid", "open", "pending"].includes(v) ? "badge-yellow" :
    ["lent"].includes(v) ? "badge-blue" : "badge-gray";
  return value && value !== "-" ? <span className={`badge ${cls}`}>{value}</span> : <span className="text-slate-400">—</span>;
}

const STATUS_KEYS = ["status", "transaction_type", "debt_type", "frequency"];

export default function CrudPage({ title, service, fields }) {
  const [items, setItems] = useState([]);
  const [record, setRecord] = useState({});
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    service.list()
      .then(r => setItems(getRows(r)))
      .catch(x => { setIsError(true); setMessage(readError(x)); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setSelected(null); setRecord({}); setMessage(""); setOpen(true); };
  const cancel = () => { setOpen(false); setSelected(null); setRecord({}); setMessage(""); };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      selected ? await service.update(selected.id, record) : await service.create(record);
      cancel();
      setIsError(false); setMessage("Saved successfully.");
      load();
    } catch (x) { setIsError(true); setMessage(readError(x)); }
    finally { setSaving(false); }
  };

  const edit = x => { setSelected(x); setRecord(x); setMessage(""); setOpen(true); };

  const remove = async x => {
    if (confirm(`Delete this ${title.toLowerCase().replace(/s$/, "")}?`)) {
      try { await service.remove(x.id); load(); }
      catch (x) { setIsError(true); setMessage(readError(x)); }
    }
  };

  const displayFields = fields.slice(0, 4);

  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-slate-500 text-sm">{loading ? "Loading…" : `${items.length} record${items.length !== 1 ? "s" : ""}`}</p>
        </div>
        <div className="flex gap-2">
          {!loading && items.length > 0 && (
            <button className="btn outline" onClick={() => exportCsv(`${title.toLowerCase().replace(/\s+/g, "_")}.csv`, items)} title="Export CSV">
              <i className="bi bi-download mr-1" />Export CSV
            </button>
          )}
          {!open && (
            <button className="btn primary" onClick={openAdd}>
              <i className="bi bi-plus-lg mr-1" />Add {title.replace(/s$/, "")}
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className={`mb-4 text-sm p-3 rounded-xl ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <i className={`bi ${isError ? "bi-exclamation-circle" : "bi-check-circle"} mr-2`} />{message}
        </p>
      )}

      {open && (
        <div className="card p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">{selected ? `Edit ${title.replace(/s$/, "")}` : `New ${title.replace(/s$/, "")}`}</h2>
            <button type="button" onClick={cancel} className="text-slate-400 hover:text-slate-700"><i className="bi bi-x-lg" /></button>
          </div>
          <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
            {fields.map(f => (
              <Field key={f.key} f={f} value={record[f.key]} onChange={v => setRecord({ ...record, [f.key]: v })} />
            ))}
            <div className="md:col-span-2 flex gap-3 pt-1">
              <button className="btn primary" disabled={saving}>
                {saving ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</> : (selected ? "Update" : "Save")}
              </button>
              <button type="button" className="btn outline" onClick={cancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <i className="bi bi-inbox text-5xl block mb-3" />
            <p className="font-semibold">No {title.toLowerCase()} yet.</p>
            <button className="btn primary mt-4" onClick={openAdd}>Add your first one</button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {displayFields.map(f => <th key={f.key}>{f.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(x => (
                <tr key={x.id}>
                  {displayFields.map(f => (
                    <td key={f.key}>
                      {STATUS_KEYS.includes(f.key)
                        ? <Badge value={x[f.key]} />
                        : <span>{String(x[f.key] ?? "—")}</span>}
                    </td>
                  ))}
                  <td>
                    <button className="text-emerald-700 hover:text-emerald-900 mr-4" onClick={() => edit(x)} title="Edit">
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => remove(x)} title="Delete">
                      <i className="bi bi-trash" />
                    </button>
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
