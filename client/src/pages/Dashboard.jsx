import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showPlayers showMatches showFavourites />

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-10">
          <p className="text-sm font-extrabold tracking-[0.18em] text-amber-700">
            DASHBOARD
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
            Welcome to CricketHub
          </h1>

          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-500">
            Your cricket information centre. Search players, explore matches,
            and manage your favourite cricket information.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          <DashboardCard
            icon="👤"
            title="Players"
            description="Search players and view their information and statistics."
            to="/players"
          />

          <DashboardCard
            icon="🏆"
            title="Matches"
            description="Explore upcoming and completed cricket matches."
            to="/matches"
          />

          <DashboardCard
            icon="⭐"
            title="Favourites"
            description="Access the players and matches you have saved."
            to="/favourites"
          />
        </section>

        {user?.role === 'Administrator' && (
          <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm font-extrabold tracking-wider text-amber-700">
              ADMINISTRATOR
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Administration tools
            </h2>

            <p className="mt-2 text-slate-600">
              Manage player records, matches, lineups, and results from the administrator dashboard.
            </p>
            <Link to="/admin" className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Open administration
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

function DashboardCard({ icon, title, description, to }) {
  const className = 'block rounded-xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg';
  const content = (
    <>
      <div className="text-2xl">{icon}</div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 leading-7 text-slate-500">{description}</p>
    </>
  );

  return (
    to ? <Link to={to} className={className}>{content}</Link> : <div className={className}>{content}</div>
  );
}

export default Dashboard;
