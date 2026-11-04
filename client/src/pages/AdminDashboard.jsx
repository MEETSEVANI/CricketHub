import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader admin showPlayers showMatches showFavourites />

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <p className="text-sm font-extrabold tracking-[0.18em] text-amber-600">
          ADMINISTRATION
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Administrator Dashboard
        </h1>

        <p className="mt-3 text-slate-500">
          Manage player records, matches, lineups, and results.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <AdminCard
            title="Manage Players"
            description="Create, update, view, and remove player records."
            to="/admin/players"
          />

          <AdminCard
            title="Manage Matches"
            description="Create, update, and remove match records and results."
            to="/admin/matches"
          />
        </div>
      </main>
    </div>
  );
}

function AdminCard({ title, description, to }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>

      <p className="mt-2 leading-7 text-slate-500">{description}</p>

      <Link to={to} className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
        Open {title === 'Manage Players' ? 'player' : 'match'} management
      </Link>
    </div>
  );
}

export default AdminDashboard;
