import { MapPin, Clock, Building2 } from "lucide-react";
import type { Movie } from "../types";
import StatusBadge from "./StatusBadge";
import Poster from "./Poster";
import { ago } from "../lib/format";

export default function MovieCard({ movie, onOpen }: { movie: Movie; onOpen: () => void }) {
  const next = movie.shows.find(s => s.status !== "SOLD_OUT");
  const theatres = new Set(movie.shows.map(s => s.theatre)).size;
  return (
    <button onClick={onOpen} className="flex w-full gap-4 rounded-xl border border-line bg-panel p-4 text-left transition-colors hover:border-violet/50 focus-visible:ring-2 focus-visible:ring-violet/60 outline-none">
      <Poster title={movie.title} className="h-28 w-20 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{movie.title}</h3>
            <p className="text-sm text-mute">{movie.language}</p>
          </div>
          <StatusBadge status={movie.status} />
        </div>
        <p className="flex items-center gap-1.5 text-sm text-mute"><MapPin size={14} />{movie.city}<Building2 size={14} className="ml-2" />{theatres} {theatres === 1 ? "theatre" : "theatres"}</p>
        <p className="text-sm">{next ? <>Next: {next.theatre}, {next.time}</> : <span className="text-mute">No shows listed yet</span>}</p>
        <p className="flex items-center gap-1.5 text-xs text-mute"><Clock size={12} />Checked {ago(movie.lastChecked)}{!movie.active && ", paused"}</p>
      </div>
    </button>
  );
}
