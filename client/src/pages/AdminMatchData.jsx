import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiRequest, sendJson } from '../services/apiClient';

function AdminMatchData() {
  const { id } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lineups, setLineups] = useState({ teamA: [], teamB: [] });
  const [performances, setPerformances] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [details, playerData] = await Promise.all([
        apiRequest(`/matches/${id}`),
        apiRequest('/players'),
      ]);
      setMatchData(details);
      setPlayers(playerData.players);
      setLineups({
        teamA: details.lineups.filter((item) => item.team_name === details.match.team_a).map((item) => item.player_id),
        teamB: details.lineups.filter((item) => item.team_name === details.match.team_b).map((item) => item.player_id),
      });
      setPerformances(Object.fromEntries(details.performances.map((item) => [item.player_id, { runs: item.runs, wickets: item.wickets }])));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([apiRequest(`/matches/${id}`), apiRequest('/players')])
      .then(([details, playerData]) => {
        if (!active) return;
        setMatchData(details);
        setPlayers(playerData.players);
        setLineups({
          teamA: details.lineups.filter((item) => item.team_name === details.match.team_a).map((item) => item.player_id),
          teamB: details.lineups.filter((item) => item.team_name === details.match.team_b).map((item) => item.player_id),
        });
        setPerformances(Object.fromEntries(details.performances.map((item) => [item.player_id, { runs: item.runs, wickets: item.wickets }])));
        setError('');
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const selectedPlayerIds = useMemo(() => [...lineups.teamA, ...lineups.teamB], [lineups]);
  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedPlayerIds.includes(player.id)),
    [players, selectedPlayerIds]
  );

  function togglePlayer(teamKey, playerId) {
    setLineups((current) => {
      const selected = current[teamKey].includes(playerId);
      return {
        ...current,
        [teamKey]: selected
          ? current[teamKey].filter((idValue) => idValue !== playerId)
          : [...current[teamKey], playerId],
      };
    });
    setPerformances((current) => ({ ...current, [playerId]: current[playerId] || { runs: 0, wickets: 0 } }));
    setMessage('');
  }

  async function saveLineups(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const data = await apiRequest(`/matches/${id}/lineups`, sendJson('PUT', {
        team_a_player_ids: lineups.teamA,
        team_b_player_ids: lineups.teamB,
      }));
      setMessage(data.message);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function updatePerformance(playerId, field, value) {
    setPerformances((current) => ({
      ...current,
      [playerId]: { ...(current[playerId] || { runs: 0, wickets: 0 }), [field]: value },
    }));
  }

  async function savePerformances(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const data = await apiRequest(`/matches/${id}/performances`, sendJson('PUT', {
        performances: selectedPlayers.map((player) => ({
          player_id: player.id,
          runs: Number(performances[player.id]?.runs ?? 0),
          wickets: Number(performances[player.id]?.wickets ?? 0),
        })),
      }));
      setMessage(data.message);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader admin showPlayers showMatches showFavourites />
      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        <Link to="/admin/matches" className="text-sm font-semibold text-amber-700 hover:underline">← Manage matches</Link>
        <p className="mt-6 text-sm font-extrabold tracking-[0.18em] text-amber-600">ADMINISTRATION</p>
        <h1 className="mt-2 text-4xl font-black">Match lineups and performances</h1>
        {loading && <p role="status" className="mt-5 text-slate-500">Loading match data…</p>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</p>}
        {matchData && <>
          <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-700">{matchData.match.status}</p>
            <h2 className="mt-2 text-2xl font-black">{matchData.match.match_name}</h2>
            <p className="mt-1 text-slate-600">{matchData.match.team_a} vs {matchData.match.team_b}</p>
            {matchData.match.status === 'Completed' && <p className="mt-3 font-semibold text-emerald-700">{matchData.match.result}</p>}
          </article>

          <form onSubmit={saveLineups} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Team lineups</h2>
            <p className="mt-1 text-sm text-slate-500">Choose up to 11 different players for each team.</p>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <PlayerSelection
                teamName={matchData.match.team_a}
                players={players}
                selectedIds={lineups.teamA}
                otherTeamIds={lineups.teamB}
                onToggle={(playerId) => togglePlayer('teamA', playerId)}
              />
              <PlayerSelection
                teamName={matchData.match.team_b}
                players={players}
                selectedIds={lineups.teamB}
                otherTeamIds={lineups.teamA}
                onToggle={(playerId) => togglePlayer('teamB', playerId)}
              />
            </div>
            <button className="mt-6 rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700">Save lineups</button>
          </form>

          {matchData.match.status === 'Completed' && <form onSubmit={savePerformances} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Player performances</h2>
            <p className="mt-1 text-sm text-slate-500">Enter runs and wickets for players assigned to either lineup.</p>
            {selectedPlayers.length ? <div className="mt-4 divide-y divide-slate-100">
              {selectedPlayers.map((player) => <div key={player.id} className="grid items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_120px_120px]">
                <span className="font-semibold">{player.name}</span>
                <Field label={`${player.name} runs`} name="runs" value={performances[player.id]?.runs ?? 0} onChange={(value) => updatePerformance(player.id, 'runs', value)} />
                <Field label={`${player.name} wickets`} name="wickets" value={performances[player.id]?.wickets ?? 0} onChange={(value) => updatePerformance(player.id, 'wickets', value)} />
              </div>)}
            </div> : <p className="mt-4 text-sm text-slate-500">Save at least one team lineup before entering performance data.</p>}
            <button disabled={!selectedPlayers.length} className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">Save performances</button>
          </form>}
        </>}
      </main>
    </div>
  );
}

function PlayerSelection({ teamName, players, selectedIds, otherTeamIds, onToggle }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-4">
      <legend className="px-2 font-bold">{teamName}</legend>
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {players.map((player) => {
          const selected = selectedIds.includes(player.id);
          const assignedElsewhere = otherTeamIds.includes(player.id);
          const limitReached = selectedIds.length >= 11 && !selected;
          return <label key={player.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
            <input
              type="checkbox"
              aria-label={`Add ${player.name} to ${teamName} lineup`}
              checked={selected}
              disabled={assignedElsewhere || limitReached}
              onChange={() => onToggle(player.id)}
              className="h-4 w-4 accent-amber-600"
            />
            <span>{player.name} <span className="text-sm text-slate-500">· {player.country} · {player.role}</span></span>
          </label>;
        })}
      </div>
      <p className="mt-3 text-sm text-slate-500">{selectedIds.length} selected</p>
    </fieldset>
  );
}

function Field({ label, name, value, onChange }) {
  return <label className="block text-sm font-semibold">{label}<input type="number" min="0" step="1" name={name} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>;
}

export default AdminMatchData;
