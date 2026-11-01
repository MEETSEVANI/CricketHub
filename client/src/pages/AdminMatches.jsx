import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiRequest, sendJson } from '../services/apiClient';

const EMPTY_MATCH = {
  match_name: '',
  team_a: '',
  team_b: '',
  match_datetime: '',
  venue: '',
  status: 'Scheduled',
  result: '',
};

function toLocalDateTime(value) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(EMPTY_MATCH);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadMatches() {
    try {
      const data = await apiRequest('/matches');
      setMatches(data.matches);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    let active = true;
    apiRequest('/matches')
      .then((data) => { if (active) setMatches(data.matches); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function beginEdit(match) {
    setEditingId(match.id);
    setForm({
      match_name: match.match_name,
      team_a: match.team_a,
      team_b: match.team_b,
      match_datetime: toLocalDateTime(match.match_datetime),
      venue: match.venue,
      status: match.status,
      result: match.result || '',
    });
    setMessage('');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_MATCH);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const path = editingId ? `/matches/${editingId}` : '/matches';
      const method = editingId ? 'PUT' : 'POST';
      const match = { ...form, match_datetime: new Date(form.match_datetime).toISOString() };
      const data = await apiRequest(path, sendJson(method, match));
      setMessage(data.message);
      resetForm();
      await loadMatches();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDelete(match) {
    if (!window.confirm(`Delete ${match.match_name}?`)) return;
    setMessage('');
    setError('');
    try {
      const data = await apiRequest(`/matches/${match.id}`, { method: 'DELETE' });
      setMessage(data.message);
      if (editingId === match.id) resetForm();
      await loadMatches();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader admin showPlayers showMatches showFavourites />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm font-extrabold tracking-[0.18em] text-amber-600">ADMINISTRATION</p>
        <h1 className="mt-2 text-4xl font-black">Manage matches</h1>
        {message && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">{editingId ? 'Edit match' : 'Add a match'}</h2>
            <Field label="Match name" name="match_name" value={form.match_name} onChange={handleChange} required maxLength={160} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Team A" name="team_a" value={form.team_a} onChange={handleChange} required maxLength={100} />
              <Field label="Team B" name="team_b" value={form.team_b} onChange={handleChange} required maxLength={100} />
            </div>
            <Field label="Date and time" name="match_datetime" type="datetime-local" value={form.match_datetime} onChange={handleChange} required />
            <Field label="Venue" name="venue" value={form.venue} onChange={handleChange} required maxLength={160} />
            <label className="block text-sm font-semibold">Status
              <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option>Scheduled</option><option>Completed</option>
              </select>
            </label>
            {form.status === 'Completed' && <Field label="Result" name="result" value={form.result} onChange={handleChange} required maxLength={240} />}
            <div className="flex gap-3">
              <button className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700">{editingId ? 'Save changes' : 'Create match'}</button>
              {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold">Cancel</button>}
            </div>
          </form>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Match records <span className="text-sm font-normal text-slate-500">({matches.length})</span></h2>
            <div className="mt-4 divide-y divide-slate-100">
              {matches.map((match) => (
                <div key={match.id} data-testid={`match-row-${match.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <h3 className="font-bold">{match.match_name}</h3>
                    <p className="text-sm text-slate-500">{match.team_a} vs {match.team_b} · {match.status}</p>
                    <p className="text-sm text-slate-500">{new Date(match.match_datetime).toLocaleString()} · {match.venue}</p>
                    {match.result && <p className="text-sm text-emerald-700">{match.result}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/admin/matches/${match.id}/data`} className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50">Manage match data</Link>
                    <button onClick={() => beginEdit(match)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button>
                    <button onClick={() => handleDelete(match)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', ...props }) {
  return <label className="block text-sm font-semibold">{label}<input name={name} type={type} value={value} onChange={onChange} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-amber-500" {...props} /></label>;
}

export default AdminMatches;
