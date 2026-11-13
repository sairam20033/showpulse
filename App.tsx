import { useState } from "react";
import { LayoutDashboard, Plus, Settings as Cog, Radio } from "lucide-react";
import { sampleMovies } from "./data/sample";
import type { Movie } from "./types";
import Overview from "./components/Overview";
import MovieCard from "./components/MovieCard";
import MovieDetails from "./components/MovieDetails";
import AddMovie from "./components/AddMovie";
import Settings from "./components/Settings";

type Tab = "dashboard" | "add" | "settings";
const TABS = [
  { id: "dashboard", label: "My movies", icon: LayoutDashboard },
  { id: "add", label: "Add movie", icon: Plus },
  { id: "settings", label: "Settings", icon: Cog },
] as const;

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [movies, setMovies] = useState<Movie[]>(sampleMovies);
  const [openId, setOpenId] = useState<string | null>(null);
  const [intervalMin, setIntervalMin] = useState(30);
  const current = movies.find(m => m.id === openId);
  const go = (t: Tab) => { setTab(t); setOpenId(null); };

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-56 shrink-0 border-r border-line p-5 md:block">
        <div className="mb-8 flex items-center gap-2 text-lg font-bold"><Radio className="text-violet" size={20} />ShowPulse</div>
        <nav className="space-y-1">{TABS.map(t => (
          <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${tab === t.id ? "bg-raised text-white" : "text-mute hover:text-white"}`}>
            <t.icon size={16} />{t.label}</button>))}
        </nav>
      </aside>
      <main className="flex-1 space-y-6 p-4 pb-24 md:p-8">
        <header>
          <h1 className="text-2xl font-bold md:hidden">ShowPulse</h1>
          <p className="text-mute">Never miss the first show.</p>
          <p className="mt-2 inline-block rounded-md bg-raised px-2 py-1 text-xs text-mute">Showing sample data</p>
        </header>
        {tab === "dashboard" && !current && (<>
          <Overview movies={movies} intervalMin={intervalMin} />
          {movies.length === 0
            ? <p className="rounded-xl border border-dashed border-line p-8 text-center text-mute">No movies yet. Add a BookMyShow link to start tracking.</p>
            : <div className="grid gap-3 lg:grid-cols-2">{movies.map(m => <MovieCard key={m.id} movie={m} onOpen={() => setOpenId(m.id)} />)}</div>}
        </>)}
        {tab === "dashboard" && current && (
          <MovieDetails movie={current} onBack={() => setOpenId(null)}
            onToggle={() => setMovies(ms => ms.map(m => m.id === current.id ? { ...m, active: !m.active } : m))}
            onRemove={() => { setMovies(ms => ms.filter(m => m.id !== current.id)); setOpenId(null); }} />
        )}
        {tab === "add" && <AddMovie existing={movies} onAdd={m => { setMovies(ms => [...ms, m]); go("dashboard"); }} />}
        {tab === "settings" && <Settings intervalMin={intervalMin} onInterval={setIntervalMin} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 flex border-t border-line bg-panel md:hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${tab === t.id ? "text-violet" : "text-mute"}`}>
            <t.icon size={18} />{t.label}</button>))}
      </nav>
    </div>
  );
}
