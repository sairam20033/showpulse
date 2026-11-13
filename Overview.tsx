import type { Movie } from "../types";
import { ago } from "../lib/format";

export default function Overview({ movies, intervalMin }: { movies: Movie[]; intervalMin: number }) {
  const avail = movies.reduce((n, m) => n + m.shows.filter(s => s.status !== "SOLD_OUT").length, 0);
  const upcoming = movies.filter(m => m.status === "NOT_YET_OPEN").length;
  const last = ([...movies.map(m => m.lastChecked)].filter(Boolean) as string[]).sort().at(-1) ?? null;
  const nextAt = last ? new Date(new Date(last).getTime() + intervalMin * 60000) : null;
  const items = [
    ["Movies tracked", String(movies.length)],
    ["Shows available now", String(avail)],
    ["Waiting for booking to open", String(upcoming)],
    ["Last successful check", ago(last)],
    ["Next check", nextAt ? nextAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "None scheduled"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(([k, v], i) => (
        <div key={k} className={`rounded-xl border bg-panel p-4 ${i === 1 ? "border-violet/40" : "border-line"}`}>
          <dd className="text-xl font-semibold">{v}</dd>
          <dt className="mt-1 text-xs text-mute">{k}</dt>
        </div>
      ))}
    </dl>
  );
}
