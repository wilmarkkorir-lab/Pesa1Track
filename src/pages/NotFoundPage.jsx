import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <i className="bi bi-compass text-7xl text-emerald-500 mb-4" />
      <h1 className="text-6xl font-black text-slate-800 mb-2">404</h1>
      <p className="text-xl font-bold text-slate-600 mb-1">Page not found</p>
      <p className="text-slate-400 text-sm mb-8">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/app" className="btn primary px-6">
        <i className="bi bi-house mr-2" />Go to Dashboard
      </Link>
    </div>
  );
}
