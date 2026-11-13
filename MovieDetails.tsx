import { ArrowLeft, ExternalLink, Pause, Play, Trash2 } from "lucide-react";
import type { Movie, Show } from "../types";
import StatusBadge from "./StatusBadge";
import Poster from "./Poster";
import { ago } from "../lib/format";

const CLS = { AVAILABLE: "text-emerald-300", FILLING_FAST: "text-amber-300", SOLD_OUT: "text-rose-300" };
const LABEL = { AVAILABLE: "Available", FILLING_FAST: "Filling fast", SOLD_OUT: "Sold out" };

export default function MovieDetails({ movie, onBack, onToggle, onRemove }: { movie: Movie; onBack: () => void; onToggle: () => void; onRemove: () => void }) {
  const byTheatre = movie.shows.reduce<Record<string, Show[]>>((a, s) => { (a[s.theatre] ||= []).push(s); return a; }, {});
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="btn-ghost"><ArrowLeft size={16} />All movies</button>
      <div className="flex gap-4">
        <Poster title={movie.title} className="h-36 w-24 shrink-0" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{movie.title}</h2>
          <p className="text-sm text-mute">{movie.language}, {movie.city}, {movie.eventCode}</p>
          <StatusBadge status={movie.status} />
          <p className="text-xs text-mute">Last checked {ago(movie.lastChecked)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={movie.url} target="_blank" rel="noopener noreferrer" className="btn-primary"><ExternalLink size={16} />Open on BookMyShow</a>
        <button onClick={onToggle} className="btn-ghost">{movie.active ? <><Pause size={16} />Pause tracking</> : <><Play size={16} />Resume tracking</>}</button>
        <button onClick={onRemove} className="btn-ghost text-rose-300"><Trash2 size={16} />Remove</button>
      </div>
      {movie.shows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-sm text-mute">No shows yet. You'll get a Telegram message when booking opens.</p>
      ) : Object.entries(byTheatre).map(([theatre, shows]) => (
        <section key={theatre} className="rounded-xl border border-line bg-panel">
          <h3 className="border-b border-line px-4 py-3 font-medium">{theatre}</h3>
          <ul className="divide-y divide-line">
            {shows.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div><p className="font-medium">{s.time}</p><p className="text-xs text-mute">{s.date}, {s.category}</p></div>
                <div className="text-right"><p>₹{s.price}</p><p className={`text-xs ${CLS[s.status]}`}>{LABEL[s.status]}</p></div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
