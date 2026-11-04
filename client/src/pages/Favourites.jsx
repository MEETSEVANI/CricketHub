import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiRequest } from '../services/apiClient';

function Favourites() {
  const [favourites, setFavourites] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest('/favourites')
      .then((data) => { if (active) setFavourites(data.favourites); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function remove(item) {
    const id = item.type === 'player' ? item.player_id : item.match_id;
    try {
      await apiRequest(`/favourites/${item.type}/${id}`, { method: 'DELETE' });
      setFavourites((current) => current.filter((entry) => entry.id !== item.id));
      setError('');
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showPlayers showMatches showFavourites />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-extrabold tracking-[0.18em] text-amber-700">YOUR SAVED CRICKET</p>
        <h1 className="mt-2 text-4xl font-black">Favourites</h1>
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading && <p role="status" className="mt-7 text-slate-500">Loading favourites…</p>}
        {!loading && favourites.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {favourites.map((item) => {
            const isPlayer = item.type === 'player';
            const title = isPlayer ? item.player_name : item.match_name;
            const href = isPlayer ? `/players/${item.player_id}` : `/matches/${item.match_id}`;
            const subtext = isPlayer ? `${item.country} · ${item.role}` : `${item.team_a} vs ${item.team_b} · ${item.match_status}`;
            return <article key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">{item.type}</p><h2 className="mt-1 text-lg font-bold"><Link className="hover:text-amber-700" to={href}>{title}</Link></h2><p className="mt-1 text-sm text-slate-500">{subtext}</p></div>
              <button aria-label={`Remove ${title} from favourites`} onClick={() => remove(item)} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Remove</button>
            </article>;
          })}
        </div> : !loading && !error && <div className="mt-7 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold">You haven’t saved anything yet.</p><p className="mt-2 text-slate-500">Browse players or matches and add favourites to find them here.</p><div className="mt-5 flex justify-center gap-3"><Link className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" to="/players">Find players</Link><Link className="rounded-lg border border-slate-300 px-4 py-2 font-semibold" to="/matches">Browse matches</Link></div></div>}
      </main>
    </div>
  );
}

export default Favourites;
