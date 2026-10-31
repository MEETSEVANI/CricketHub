import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiRequest, sendJson } from '../services/apiClient';

function Players() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiRequest(`/players?q=${encodeURIComponent(query)}`),
      apiRequest('/favourites'),
    ]).then(([playerResult, favouriteResult]) => {
      if (!active) return;
      if (playerResult.status === 'rejected') {
        setError(playerResult.reason.message);
        return;
      }
      setPlayers(playerResult.value.players);
      if (favouriteResult.status === 'fulfilled') {
        setFavouriteIds(new Set(favouriteResult.value.favourites.filter((item) => item.type === 'player').map((item) => item.player_id)));
      }
      setError('');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [query]);

  async function toggleFavourite(playerId) {
    try {
      if (favouriteIds.has(playerId)) {
        await apiRequest(`/favourites/player/${playerId}`, { method: 'DELETE' });
        setFavouriteIds((current) => new Set([...current].filter((id) => id !== playerId)));
      } else {
        await apiRequest('/favourites', sendJson('POST', { type: 'player', id: playerId }));
        setFavouriteIds((current) => new Set([...current, playerId]));
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showPlayers />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm font-extrabold tracking-[0.18em] text-amber-600">PLAYER DIRECTORY</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Find a player</h1>
        <label className="mt-7 block max-w-2xl">
          <span className="sr-only">Search players by name</span>
          <input aria-label="Search players by name" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by player name" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
        </label>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <p className="mt-8 text-slate-500">Loading players…</p> : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <article key={player.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <Link to={`/players/${player.id}`} className="min-w-0 hover:text-amber-700">
                  <h2 className="truncate text-lg font-bold">{player.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{player.country} · {player.role}</p>
                </Link>
                <button aria-label={`${favouriteIds.has(player.id) ? 'Remove' : 'Add'} ${player.name} ${favouriteIds.has(player.id) ? 'from' : 'to'} favourites`} onClick={() => toggleFavourite(player.id)} className="rounded-lg px-3 py-2 text-xl text-amber-600 hover:bg-amber-50">
                  {favouriteIds.has(player.id) ? '★' : '☆'}
                </button>
              </article>
            ))}
          </div>
        )}
        {!loading && !error && players.length === 0 && <p className="mt-8 text-slate-500">No players match that search.</p>}
      </main>
    </div>
  );
}

export default Players;
