import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiRequest, sendJson } from '../services/apiClient';

function Matches() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [matches, setMatches] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filter) params.set('status', filter);
    Promise.allSettled([apiRequest(`/matches?${params}`), apiRequest('/favourites')])
      .then(([matchResult, favouriteResult]) => {
        if (!active) return;
        if (matchResult.status === 'rejected') throw matchResult.reason;
        setMatches(matchResult.value.matches);
        if (favouriteResult.status === 'fulfilled') {
          setFavouriteIds(new Set(favouriteResult.value.favourites.filter((item) => item.type === 'match').map((item) => item.match_id)));
        }
        setError('');
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, filter]);

  async function toggleFavourite(matchId) {
    try {
      if (favouriteIds.has(matchId)) {
        await apiRequest(`/favourites/match/${matchId}`, { method: 'DELETE' });
        setFavouriteIds((current) => new Set([...current].filter((id) => id !== matchId)));
      } else {
        await apiRequest('/favourites', sendJson('POST', { type: 'match', id: matchId }));
        setFavouriteIds((current) => new Set([...current, matchId]));
      }
      setError('');
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showPlayers showMatches showFavourites />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm font-extrabold tracking-[0.18em] text-amber-700">MATCH CENTRE</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Cricket matches</h1>
        <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <input aria-label="Search matches" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by match or team name" className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
          <select aria-label="Filter matches by status" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3">
            <option value="">All matches</option><option value="Scheduled">Upcoming</option><option value="Completed">Completed</option>
          </select>
        </div>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <p className="mt-8 text-slate-500">Loading matches…</p> : (
          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            {matches.map((match) => (
              <article key={match.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">{match.status}</p>
                    <h2 className="mt-2 text-xl font-bold"><Link className="hover:text-amber-700" to={`/matches/${match.id}`}>{match.match_name}</Link></h2>
                    <p className="mt-2 text-slate-600">{match.team_a} <span className="px-1 text-slate-600">vs</span> {match.team_b}</p>
                    <p className="mt-2 text-sm text-slate-500">{new Date(match.match_datetime).toLocaleString()} · {match.venue}</p>
                    {match.status === 'Completed' && <p className="mt-3 font-semibold text-emerald-700">{match.result}</p>}
                  </div>
                  <button aria-label={`${favouriteIds.has(match.id) ? 'Remove' : 'Add'} ${match.match_name} ${favouriteIds.has(match.id) ? 'from' : 'to'} favourites`} onClick={() => toggleFavourite(match.id)} className="shrink-0 rounded-lg px-3 py-2 text-xl text-amber-700 hover:bg-amber-50">{favouriteIds.has(match.id) ? '★' : '☆'}</button>
                </div>
              </article>
            ))}
          </section>
        )}
        {!loading && !error && matches.length === 0 && <p className="mt-8 text-slate-500">No matches found.</p>}
      </main>
    </div>
  );
}

export default Matches;
