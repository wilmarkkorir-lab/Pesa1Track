import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OfflineBanner from "./OfflineBanner";

const links = [
  ["/app", "Dashboard", "bi-grid-1x2"],
  ["/app/transactions", "Transactions", "bi-arrow-left-right"],
  ["/app/budgets", "Budgets", "bi-pie-chart"],
  ["/app/goals", "Goals", "bi-bullseye"],
  ["/app/categories", "Categories", "bi-tags"],
  ["/app/recurring", "Recurring", "bi-arrow-repeat"],
  ["/app/bills", "Bills", "bi-receipt"],
  ["/app/debts", "Debts", "bi-people"],
  ["/app/businesses", "Businesses", "bi-shop"],
  ["/app/ai", "AI Assistant", "bi-robot"],
  ["/app/settings", "Settings", "bi-gear"],
];

// Bottom nav shows only the 5 most important links on mobile
const bottomLinks = [
  ["/app", "Home", "bi-grid-1x2"],
  ["/app/transactions", "Transactions", "bi-arrow-left-right"],
  ["/app/budgets", "Budgets", "bi-pie-chart"],
  ["/app/ai", "AI", "bi-robot"],
  ["/app/settings", "Settings", "bi-gear"],
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const n = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 w-64 flex-col bg-slate-950 text-slate-300 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-20">
        <div className="px-5 pt-5 pb-3 shrink-0">
          <b className="text-white text-2xl"><i className="bi bi-wallet2 text-emerald-400 mr-2" />PesaTrack</b>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map(([to, label, icon]) => (
            <NavLink end={to === "/app"} key={to} to={to}
              className={({ isActive }) => `flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-emerald-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}>
              <i className={`bi ${icon} mr-3 text-base`} />{label}
            </NavLink>
          ))}
        </nav>
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
          <button onClick={() => { signOut(); n("/login"); }}
            className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm py-1">
            <i className="bi bi-box-arrow-left" /> Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-950 text-white">
        <b className="text-lg"><i className="bi bi-wallet2 text-emerald-400 mr-2" />PesaTrack</b>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-14 md:top-0 z-10">
          <div>
            <b className="text-sm md:text-base">Finance workspace</b>
            <p className="text-xs text-slate-500 hidden sm:block">PesaTrack</p>
          </div>
          <NavLink to="/app/transactions" className="btn primary text-xs md:text-sm px-3 py-2">
            <i className="bi bi-plus-lg mr-1" />Add
          </NavLink>
        </header>
        <div className="max-w-7xl mx-auto p-3 md:p-7 w-full">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {bottomLinks.map(([to, label, icon]) => (
          <NavLink end={to === "/app"} key={to} to={to}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"}`}>
            <i className={`bi ${icon} text-xl`} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <OfflineBanner />
    </div>
  );
}
