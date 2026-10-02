export function exportCsv(filename, rows) {
  if (!rows.length) return;
  const exclude = ["user"];
  const keys = Object.keys(rows[0]).filter(k => !exclude.includes(k));
  const header = keys.join(",");
  const body = rows.map(r =>
    keys.map(k => {
      const v = r[k] ?? "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  ).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
