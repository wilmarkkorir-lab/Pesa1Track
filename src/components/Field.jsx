export default function Field({ f, value, onChange }) {
  if (f.options) {
    return (
      <label className="label">{f.label}
        <select className="input mt-1" value={value !== undefined && value !== null ? String(value) : ""} required={f.required !== false} onChange={e => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {f.options.map(x => <option key={x.value ?? x} value={x.value ?? x}>{x.label ?? x}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="label">{f.label}
      <input
        className="input mt-1"
        required={f.required !== false}
        type={f.type || "text"}
        value={value ?? ""}
        onChange={e => onChange(f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      />
    </label>
  );
}
