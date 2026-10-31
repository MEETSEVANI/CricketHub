import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AppHeader({ admin = false, showPlayers = false, showMatches = false, showFavourites = false }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
          <span className="text-3xl" aria-hidden="true">🏏</span><span>CricketHub</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/dashboard">Home</Link>
          {showPlayers && <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/players">Players</Link>}
          {showMatches && <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/matches">Matches</Link>}
          {showFavourites && <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/favourites">Favourites</Link>}
          {admin && <Link className="rounded-lg px-3 py-2 text-amber-700 hover:bg-amber-50" to="/admin">Admin</Link>}
          <span className="hidden px-2 text-slate-500 lg:inline">{user?.email}</span>
          <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100">Log out</button>
        </div>
      </nav>
    </header>
  );
}

export default AppHeader;
