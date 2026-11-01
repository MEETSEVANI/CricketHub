import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { apiRequest, sendJson } from '../services/apiClient';

const EMPTY_PLAYER = { name: '', age: '', country: '', role: 'Batsman', total_matches: '0', total_runs: '0', total_wickets: '0' };

function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState(EMPTY_PLAYER);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPlayers() {
    try {
      const data = await apiRequest('/players');
      setPlayers(data.players);
    } catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => {
    let active = true;
    apiRequest('/players')
      .then((data) => { if (active) setPlayers(data.players); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function beginEdit(player) {
    setEditingId(player.id);
    setForm({ name: player.name, age: String(player.age), country: player.country, role: player.role, total_matches: String(player.total_matches), total_runs: String(player.total_runs), total_wickets: String(player.total_wickets) });
    setMessage('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_PLAYER);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const path = editingId ? `/players/${editingId}` : '/players';
      const method = editingId ? 'PUT' : 'POST';
      const data = await apiRequest(path, sendJson(method, { ...form, age: Number(form.age), total_matches: Number(form.total_matches), total_runs: Number(form.total_runs), total_wickets: Number(form.total_wickets) }));
      setMessage(data.message);
      resetForm();
      await loadPlayers();
    } catch (requestError) { setError(requestError.message); }
  }

  async function handleDelete(player) {
    if (!window.confirm(`Delete ${player.name}?`)) return;
    setMessage('');
    setError('');
    try {
      const data = await apiRequest(`/players/${player.id}`, { method: 'DELETE' });
      setMessage(data.message);
      if (editingId === player.id) resetForm();
      await loadPlayers();
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader admin showPlayers showMatches showFavourites />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm font-extrabold tracking-[0.18em] text-amber-600">ADMINISTRATION</p>
        <h1 className="mt-2 text-4xl font-black">Manage players</h1>
        {message && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">{editingId ? 'Edit player' : 'Add a player'}</h2>
            <Field label="Player name" name="name" value={form.name} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-3"><Field label="Age" name="age" type="number" min="1" max="100" value={form.age} onChange={handleChange} required /><Field label="Country" name="country" value={form.country} onChange={handleChange} required /></div>
            <label className="block text-sm font-semibold">Role<select name="role" value={form.role} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicketkeeper</option></select></label>
            <div className="grid grid-cols-3 gap-3"><Field label="Matches" name="total_matches" type="number" min="0" value={form.total_matches} onChange={handleChange} /><Field label="Runs" name="total_runs" type="number" min="0" value={form.total_runs} onChange={handleChange} /><Field label="Wickets" name="total_wickets" type="number" min="0" value={form.total_wickets} onChange={handleChange} /></div>
            <div className="flex gap-3"><button className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700">{editingId ? 'Save changes' : 'Create player'}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold">Cancel</button>}</div>
          </form>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Player records <span className="text-sm font-normal text-slate-500">({players.length})</span></h2>
            <div className="mt-4 divide-y divide-slate-100">{players.map((player) => <div key={player.id} data-testid={`player-row-${player.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><h3 className="font-bold">{player.name}</h3><p className="text-sm text-slate-500">{player.country} · {player.age} years · {player.role} · {player.total_runs} runs</p></div>
              <div className="flex gap-2"><button onClick={() => beginEdit(player)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button><button onClick={() => handleDelete(player)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button></div>
            </div>)}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', ...props }) {
  return <label className="block text-sm font-semibold">{label}<input name={name} type={type} value={value} onChange={onChange} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-amber-500" {...props} /></label>;
}

export default AdminPlayers;
