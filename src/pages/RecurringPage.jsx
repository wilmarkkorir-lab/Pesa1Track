import { useEffect, useState } from "react";
import CrudPage from "../components/CrudPage";
import { api } from "../api/endpoints";

export default function RecurringPage() {
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    api.categories.list().then(r => {
      const rows = Array.isArray(r.data) ? r.data : (r.data?.results || []);
      setCategoryOptions(rows.map(c => ({ value: c.id, label: c.name })));
    }).catch(() => {});
  }, []);

  const fields = [
    { key: "category", label: "Category", ...(categoryOptions.length ? { options: categoryOptions } : { type: "number" }) },
    { key: "transaction_type", label: "Type", options: ["income", "expense"] },
    { key: "amount", label: "Amount", type: "number" },
    { key: "description", label: "Description", required: false },
    { key: "frequency", label: "Frequency", options: ["daily", "weekly", "monthly", "yearly"] },
    { key: "next_run_date", label: "Next run date", type: "date" },
    { key: "end_date", label: "End date", type: "date", required: false },
  ];

  return <CrudPage title="Recurring transactions" service={api.recurring} fields={fields} />;
}
