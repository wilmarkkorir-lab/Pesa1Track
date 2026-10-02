import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OfflineBanner from "./OfflineBanner";

const links = [
  ["/app", "Dashboard", "bi-grid-1x2"],
  ["/app/categories", "Categories", "bi-tags"],
  ["/app/transactions", "Transactions", "bi-arrow-left-right"],
  ["/app/budgets", "Budgets", "bi-pie-chart"],
  ["/app/goals", "Goals", "bi-bullseye"],
  ["/app/recurring", "Recurring", "bi-arrow-repeat"],
  ["/app/bills", "Bills", "bi-receipt"],
  ["/app/debts", "Debts", "bi-people"],
  ["/app/businesses", "Businesses", "bi-shop"],
  ["/app/ai", "AI Assistant", "bi-robot"],
  ["/app/settings", "Settings", "bi-gear"],
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const n = useNavigate();
  const location = useLocation();

  return (
    <div>
      <aside className="hidden md:flex fixed inset-y-0 w-64 flex-col bg-slate-950 text-slate-300 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Logo — fixed at top */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <b className="text-white text-2xl"><i className="bi bi-wallet2 text-emerald-400 mr-2" />PesaTrack</b>
        </div>

        {/* Nav — scrollable middle section */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map(([to, label, icon]) => (
            <NavLink end={to === "/app"} key={to} to={to}
              className={({ isActive }) => `flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-emerald-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}>
              <i className={`bi ${icon} mr-3 text-base`} />{label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout — always visible at bottom */}
        <div className="shrink-0 border-t border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full shrink-0">{user?.currency}</span>
          </div>
          <button
            onClick={() => { signOut(); n("/login"); }}
            className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm py-1"
          >
            <i className="bi bi-box-arrow-left" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 text-white">
        <b><i className="bi bi-wallet2 text-emerald-400 mr-2" />PesaTrack</b>
        <button onClick={() => { signOut(); n("/login"); }} className="text-red-300 text-sm">Log out</button>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex overflow-x-auto gap-2 px-3 py-2 bg-slate-900 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(([to, label, icon]) => (
          <NavLink key={to} end={to === "/app"} to={to}
            className={({ isActive }) => `whitespace-nowrap flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${isActive ? "bg-emerald-600 text-white" : "text-slate-300"}`}>
            <i className={`bi ${icon}`} />{label}
          </NavLink>
        ))}
      </div>

      <main className="md:ml-64">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <div><b>Finance workspace</b><p className="text-xs text-slate-500">PesaTrack</p></div>
          {location.pathname !== "/app/ai" && (
            <NavLink to="/app/transactions" className="btn primary">+ Add transaction</NavLink>
          )}
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-7 w-full"><Outlet /></div>
      </main>
      <OfflineBanner />
    </div>
  );
}
