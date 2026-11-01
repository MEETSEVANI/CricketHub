import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiRequest, sendJson } from '../services/apiClient';

function MatchDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest(`/matches/${id}`), apiRequest('/favourites')])
      .then(([matchResult, favouriteResult]) => {
        if (!active) return;
        if (matchResult.status === 'rejected') throw matchResult.reason;
        setData(matchResult.value);
        if (favouriteResult.status === 'fulfilled') {
          setFavourite(favouriteResult.value.favourites.some((item) => item.type === 'match' && String(item.match_id) === String(id)));
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function toggleFavourite() {
    try {
      if (favourite) await apiRequest(`/favourites/match/${id}`, { method: 'DELETE' });
      else await apiRequest('/favourites', sendJson('POST', { type: 'match', id: Number(id) }));
      setFavourite(!favourite);
      setError('');
    } catch (requestError) { setError(requestError.message); }
  }

  const match = data?.match;
  const teamPlayers = (teamName) => data?.lineups?.filter((lineup) => lineup.team_name === teamName) || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showPlayers showMatches showFavourites />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/matches" className="text-sm font-semibold text-amber-700 hover:underline">← All matches</Link>
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading && <p role="status" className="mt-6 text-slate-500">Loading match details…</p>}
        {match && <>
          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-700">{match.status}</p>
            <h1 className="mt-2 text-3xl font-black">{match.match_name}</h1>
            <p className="mt-3 text-lg text-slate-700">{match.team_a} <span className="px-2 text-slate-400">vs</span> {match.team_b}</p>
            <p className="mt-2 text-slate-500">{new Date(match.match_datetime).toLocaleString()} · {match.venue}</p>
            {match.status === 'Completed' && <p className="mt-5 rounded-lg bg-emerald-50 p-4 font-bold text-emerald-800">{match.result}</p>}
            <button onClick={toggleFavourite} className="mt-5 rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400">{favourite ? 'Remove from favourites' : 'Save to favourites'}</button>
          </article>
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            {[match.team_a, match.team_b].map((team) => <article key={team} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">{team} lineup</h2>
              {teamPlayers(team).length ? <ul className="mt-3 space-y-2">{teamPlayers(team).map((item) => <li key={item.player_id}><Link className="hover:text-amber-700" to={`/players/${item.player_id}`}>{item.name}</Link><span className="text-slate-500"> · {item.role}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Lineup has not been entered yet.</p>}
            </article>)}
          </section>
          {match.status === 'Completed' && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold">Player performances</h2>
            {data.performances.length ? <div className="mt-3 divide-y divide-slate-100">{data.performances.map((item) => <p key={item.player_id} className="flex justify-between gap-3 py-3"><span>{item.name}</span><span className="text-slate-600">{item.runs} runs · {item.wickets} wickets</span></p>)}</div> : <p className="mt-3 text-sm text-slate-500">Performance data has not been entered.</p>}
          </section>}
        </>}
      </main>
    </div>
  );
}

export default MatchDetails;
