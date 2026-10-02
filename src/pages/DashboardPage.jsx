import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { api, getRows } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#059669","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

function currency(user) {
  return x => new Intl.NumberFormat(
    user?.currency === "USD" ? "en-US" : "en-KE",
    { style: "currency", currency: user?.currency || "KES", maximumFractionDigits: 0 }
  ).format(x || 0);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const fmt = currency(user);

  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 });
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.summary().then(r => setSummary(r.data)).catch(() => {}),
      api.monthlyBreakdown().then(r => setMonthly(r.data)).catch(() => {}),
      api.categoryBreakdown().then(r => setCategories(r.data)).catch(() => {}),
      api.transactions.list().then(r => setRecent(getRows(r).slice(0, 5))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20"><div className="spinner" /></div>;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500">Welcome back, {user?.full_name || "there"}.</p>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          ["Balance", summary.balance, "bi-wallet2", summary.balance >= 0 ? "text-emerald-600" : "text-red-600", "bg-emerald-50"],
          ["Total Income", summary.total_income, "bi-arrow-down-left", "text-blue-600", "bg-blue-50"],
          ["Total Expenses", summary.total_expenses, "bi-arrow-up-right", "text-red-500", "bg-red-50"],
        ].map(([label, val, icon, color, bg]) => (
          <div className="stat-card" key={label}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">{label}</span>
              <span className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center`}>
                <i className={`bi ${icon} ${color}`} />
              </span>
            </div>
            <p className={`text-2xl font-black ${color}`}>{fmt(val)}</p>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">

        {/* Monthly trend — takes 2/3 width */}
        <div className="card p-5 md:col-span-2">
          <h2 className="font-bold mb-4">Monthly Income vs Expenses</h2>
          {monthly.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip formatter={(v, n) => [fmt(v), n === "income" ? "Income" : "Expenses"]} />
                <Area type="monotone" dataKey="income" stroke="#059669" strokeWidth={2} fill="url(#gIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie — takes 1/3 width */}
        <div className="card p-5">
          <h2 className="font-bold mb-4">Expenses by Category</h2>
          {categories.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={false}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          ["/app/transactions", "bi-plus-circle", "Add Transaction", "bg-emerald-50 text-emerald-700"],
          ["/app/goals", "bi-bullseye", "View Goals", "bg-purple-50 text-purple-700"],
          ["/app/bills", "bi-receipt", "Manage Bills", "bg-yellow-50 text-yellow-700"],
          ["/app/budgets", "bi-pie-chart", "Budgets", "bg-blue-50 text-blue-700"],
        ].map(([to, icon, label, cls]) => (
          <Link key={to} to={to} className={`card p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-shadow ${cls}`}>
            <i className={`bi ${icon} text-2xl`} />
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg">Recent Transactions</h2>
          <Link to="/app/transactions" className="text-emerald-600 text-sm font-semibold">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <i className="bi bi-inbox text-4xl block mb-2" />
            No transactions yet. <Link to="/app/transactions" className="text-emerald-600 font-semibold">Add one</Link>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Description</th><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
            <tbody>
              {recent.map(t => (
                <tr key={t.id}>
                  <td className="font-medium">{t.description || "—"}</td>
                  <td className="text-slate-500 text-sm">{t.transaction_date || t.date}</td>
                  <td><span className={`badge ${t.transaction_type === "income" ? "badge-green" : "badge-red"}`}>{t.transaction_type || t.type}</span></td>
                  <td className={`font-bold ${t.transaction_type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                    {t.transaction_type === "income" ? "+" : "-"}{fmt(t.amount)}
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
