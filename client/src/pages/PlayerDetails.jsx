import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiRequest, sendJson } from '../services/apiClient';

function PlayerDetails() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([apiRequest(`/players/${id}`), apiRequest('/favourites')])
      .then(([playerResult, favouriteResult]) => {
        if (playerResult.status === 'rejected') {
          setError(playerResult.reason.message);
          return;
        }
        setPlayer(playerResult.value.player);
        if (favouriteResult.status === 'fulfilled') {
          setFavourite(favouriteResult.value.favourites.some((item) => item.type === 'player' && String(item.player_id) === String(id)));
        }
      });
  }, [id]);

  async function toggleFavourite() {
    try {
      if (favourite) await apiRequest(`/favourites/player/${id}`, { method: 'DELETE' });
      else await apiRequest('/favourites', sendJson('POST', { type: 'player', id: Number(id) }));
      setFavourite(!favourite);
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showPlayers showMatches showFavourites />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/players" className="text-sm font-semibold text-amber-700 hover:underline">← All players</Link>
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {player && <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-amber-700">{player.country} · {player.role}</p>
          <h1 className="mt-2 text-4xl font-black">{player.name}</h1>
          <button onClick={toggleFavourite} className="mt-5 rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400">{favourite ? 'Remove from favourites' : 'Add to favourites'}</button>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Age" value={player.age} />
            <Stat label="Matches" value={player.total_matches} />
            <Stat label="Runs" value={player.total_runs} />
            <Stat label="Wickets" value={player.total_wickets} />
          </dl>
        </article>}
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-extrabold">{value}</dd></div>;
}

export default PlayerDetails;
