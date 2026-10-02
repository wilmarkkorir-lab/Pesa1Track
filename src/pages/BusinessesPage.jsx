import CrudPage from "../components/CrudPage";
import { api } from "../api/endpoints";

const fields = [
  { key: "name", label: "Business name" },
  { key: "email", label: "Email", type: "email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "address", label: "Address", required: false },
  { key: "currency", label: "Currency", options: ["KES", "USD"] },
  { key: "invoice_prefix", label: "Invoice prefix", required: false },
];

export default function BusinessesPage() {
  return <CrudPage title="Businesses" service={api.businesses} fields={fields} />;
}
