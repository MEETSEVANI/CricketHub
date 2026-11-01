import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import AdminRoute from './components/AdminRoute';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerDetails from './pages/PlayerDetails';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900"
          >
            <span className="text-3xl">🏏</span>
            <span>CricketHub</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Create Account
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-24">
          <div>
            <p className="mb-5 text-sm font-extrabold tracking-[0.18em] text-amber-600">
              YOUR CRICKET INFORMATION HUB
            </p>

            <h1 className="text-6xl font-black leading-[0.98] tracking-[-0.05em] text-slate-900 sm:text-7xl">
              Everything cricket,
              <span className="block text-amber-600">in one place.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-500">
              Search players, explore matches, view performances, and keep
              your favourite cricket information organized in one place.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rounded-lg bg-slate-900 px-6 py-4 text-center font-semibold text-white transition hover:bg-slate-700"
              >
                Get Started
              </Link>

              <a
                href="#features"
                className="rounded-lg border border-slate-300 bg-transparent px-6 py-4 text-center font-semibold text-slate-900 transition hover:bg-white"
              >
                Explore Features
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-slate-300">
                FEATURED MATCH
              </span>

              <span className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold tracking-wider">
                COMPLETED
              </span>
            </div>

            <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white font-extrabold text-slate-900">
                  IND
                </div>

                <h2 className="font-semibold">India</h2>
              </div>

              <div className="flex flex-col gap-1">
                <strong className="text-2xl">214/6</strong>
                <span className="text-xs text-slate-400">vs</span>
                <strong className="text-2xl">210/8</strong>
              </div>

              <div>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white font-extrabold text-slate-900">
                  AUS
                </div>

                <h2 className="font-semibold">Australia</h2>
              </div>
            </div>

            <div className="mt-9 border-t border-white/10 pt-6 text-center font-bold text-amber-400">
              India won by 4 runs
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto grid max-w-7xl gap-5 px-6 pb-20 md:grid-cols-3 lg:px-10"
        >
          <FeatureCard
            icon="👤"
            title="Player Search"
            description="Find player information, roles, countries, and statistics."
          />

          <FeatureCard
            icon="🏆"
            title="Match Centre"
            description="Explore upcoming and completed matches and their results."
          />

          <FeatureCard
            icon="⭐"
            title="Favourites"
            description="Save players and matches you want to access quickly."
          />
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="text-2xl">{icon}</div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>

      <p className="mt-2 leading-7 text-slate-500">{description}</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          
          <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/players/:id" element={<ProtectedRoute><PlayerDetails /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/matches/:id" element={<ProtectedRoute><MatchDetails /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;