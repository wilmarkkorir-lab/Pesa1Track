import { Link } from "react-router-dom";

const features = [
  ["bi-arrow-left-right", "Transactions", "Log every income and expense with categories, payment methods and descriptions."],
  ["bi-pie-chart", "Budgets", "Set monthly spending limits and stay on track."],
  ["bi-bullseye", "Savings Goals", "Define goals and track your progress with visual indicators."],
  ["bi-arrow-repeat", "Recurring", "Automate recurring income and expenses so nothing is missed."],
  ["bi-receipt", "Bills", "Track upcoming bills and never miss a due date."],
  ["bi-people", "Debts", "Manage money you've lent or borrowed with full history."],
  ["bi-shop", "Businesses", "Manage multiple businesses with invoicing and expenses."],
  ["bi-graph-up", "Reports", "Get a live summary of your financial health at a glance."],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
        <b className="text-xl flex items-center gap-2"><i className="bi bi-wallet2 text-emerald-600" />PesaTrack</b>
        <div className="flex gap-2">
          <Link className="btn outline" to="/login">Sign in</Link>
          <Link className="btn primary" to="/register">Get started free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4">PERSONAL FINANCE TRACKER</span>
          <h1 className="text-5xl font-black leading-tight">Know where every shilling goes.</h1>
          <p className="text-lg text-slate-600 mt-5 leading-relaxed">
            PesaTrack helps you take control of your money — track income, expenses, budgets, goals, bills, debts and businesses in one place.
          </p>
          <div className="flex gap-3 mt-8">
            <Link className="btn primary" to="/register">Create free account</Link>
            <Link className="btn outline" to="/login">Sign in</Link>
          </div>
        </div>
        <div className="card p-7 shadow-lg">
          <p className="text-slate-500 text-sm mb-1">Your balance</p>
          <p className="text-4xl font-black text-emerald-600 mb-6">KES 24,650.00</p>
          <div className="space-y-3">
            {[["Salary", "income", "KES 50,000"], ["Rent", "expense", "KES 15,000"], ["Groceries", "expense", "KES 8,500"], ["Freelance", "income", "KES 12,000"]].map(([label, type, amt]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    <i className={`bi ${type === "income" ? "bi-arrow-down-left" : "bi-arrow-up-right"}`} />
                  </span>
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <span className={`font-bold text-sm ${type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                  {type === "income" ? "+" : "-"}{amt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-2">Everything you need</h2>
          <p className="text-slate-500 text-center mb-12">All your financial tools in one clean dashboard.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {features.map(([icon, title, desc]) => (
              <div key={title} className="card p-5 hover:shadow-md transition-shadow">
                <i className={`bi ${icon} text-emerald-600 text-2xl`} />
                <p className="font-bold mt-3 mb-1">{title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
        <h2 className="text-3xl font-black mb-4">Ready to take control?</h2>
        <p className="text-slate-500 mb-8">Join PesaTrack and start making smarter financial decisions today.</p>
        <Link className="btn primary" to="/register">Create your free account</Link>
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} PesaTrack by <span className="text-emerald-600 font-semibold">Wilmark</span>. Built for smart money management.
      </footer>
    </div>
  );
}
