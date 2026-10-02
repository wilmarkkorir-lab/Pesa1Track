import CrudPage from "../components/CrudPage";
import { api } from "../api/endpoints";

const fields = [
  { key: "name", label: "Name" },
  { key: "amount", label: "Amount", type: "number" },
  { key: "due_date", label: "Due date", type: "date" },
  { key: "frequency", label: "Frequency", options: ["once", "daily", "weekly", "monthly", "yearly"] },
  { key: "status", label: "Status", options: ["unpaid", "paid", "overdue"] },
  { key: "notes", label: "Notes", required: false },
];

export default function BillsPage() {
  return <CrudPage title="Bills" service={api.bills} fields={fields} />;
}
