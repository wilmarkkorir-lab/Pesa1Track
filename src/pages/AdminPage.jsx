import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import http from "../api/http";
import { getRows } from "../api/endpoints";

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.is_superuser) { setLoading(false); return; }
    http.get("/auth/users/")
      .then(r => setUsers(getRows(r)))
      .catch(e => setError(e.response?.status === 403 ? "Access denied. Admin only." : "Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {!user?.is_superuser ? (
        <div className="card p-8 text-center text-red-500">
          <i className="bi bi-shield-x text-5xl block mb-3" />
          <p className="font-bold text-lg">Access Denied</p>
          <p className="text-sm text-slate-400 mt-1">You need admin access to view this page.</p>
        </div>
      ) : (
      <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-slate-500 text-sm">{loading ? "Loading…" : `${filtered.length} of ${users.length} users`}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
          <i className="bi bi-shield-check text-emerald-600" />
          <span className="text-emerald-700 text-sm font-semibold">Admin View</span>
        </div>
      </div>

      {error && (
        <div className="card p-8 text-center text-red-500">
          <i className="bi bi-shield-x text-5xl block mb-3" />
          <p className="font-bold text-lg">{error}</p>
          <p className="text-sm text-slate-400 mt-1">You need staff/admin access to view this page.</p>
        </div>
      )}

      {!error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              ["Total Users", users.length, "bi-people", "text-blue-600", "bg-blue-50"],
              ["Active", users.filter(u => u.is_active).length, "bi-check-circle", "text-emerald-600", "bg-emerald-50"],
              ["Admins", users.filter(u => u.is_staff).length, "bi-shield-check", "text-purple-600", "bg-purple-50"],
              ["Today", users.filter(u => u.created_at?.startsWith(new Date().toISOString().slice(0,10))).length, "bi-person-plus", "text-orange-600", "bg-orange-50"],
            ].map(([label, val, icon, color, bg]) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs">{label}</span>
                  <span className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
                    <i className={`bi ${icon} ${color} text-sm`} />
                  </span>
                </div>
                <p className={`text-2xl font-black ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="card p-4 mb-4">
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Search by name or email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-16"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <i className="bi bi-people text-5xl block mb-3" />
                <p className="font-semibold">No users found.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Currency</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{u.full_name || "—"}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{u.currency}</span></td>
                      <td className="text-slate-500 text-sm">{u.created_at?.slice(0,10) || "—"}</td>
                      <td className="text-slate-500 text-sm">{u.last_login?.slice(0,10) || "Never"}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          <span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                          {u.is_staff && <span className="badge badge-blue">Admin</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      </>
    </>
  );
}
