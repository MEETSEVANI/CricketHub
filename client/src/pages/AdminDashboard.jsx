import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"
          >
            <span className="text-3xl">🏏</span>
            <span>CricketHub</span>
          </Link>

          <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
            Administrator
          </span>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <p className="text-sm font-extrabold tracking-[0.18em] text-amber-600">
          ADMINISTRATION
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Administrator Dashboard
        </h1>

        <p className="mt-3 text-slate-500">
          Signed in as {user?.email}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <AdminCard
            title="Manage Players"
            description="Create, update, view, and remove player records."
            to="/admin/players"
            available
          />

          <AdminCard
            title="Manage Matches"
            description="Create, update, and remove match records and results."
            to="/admin/matches"
            available
          />
        </div>
      </main>
    </div>
  );
}

function AdminCard({ title, description, to, available = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>

      <p className="mt-2 leading-7 text-slate-500">{description}</p>

      {available ? <Link to={to} className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Open {title === 'Manage Players' ? 'player' : 'match'} management</Link> : <span className="mt-5 inline-block rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">Planned next</span>}
    </div>
  );
}

export default AdminDashboard;
