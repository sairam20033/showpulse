import { useState } from "react";
import { parseBmsUrl, type ParsedUrl } from "../lib/url";
import Poster from "./Poster";
import type { Movie, NotifyMode } from "../types";

const PERIODS = ["Morning", "Afternoon", "Evening", "Night"];

export default function AddMovie({ existing, onAdd }: { existing: Movie[]; onAdd: (m: Movie) => void }) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const [mode, setMode] = useState<NotifyMode>("all");
  const [times, setTimes] = useState<string[]>([]);
  const [theatres, setTheatres] = useState("");

  function check(e: React.FormEvent) {
    e.preventDefault(); setParsed(null);
    const r = parseBmsUrl(raw);
    if ("error" in r) return setErr(r.error);
    if (existing.some(m => m.eventCode === r.eventCode)) return setErr("You're already tracking this movie.");
    setErr(""); setParsed(r);
  }
  function start() {
    if (!parsed) return;
    onAdd({
      id: crypto.randomUUID(), eventCode: parsed.eventCode, title: parsed.title, language: parsed.language,
      city: parsed.city, url: parsed.url, status: "PENDING", lastChecked: null, shows: [], active: true,
      prefs: { mode, times, theatres: theatres.split(",").map(t => t.trim()).filter(Boolean) },
    });
    setRaw(""); setParsed(null); setTimes([]); setTheatres("");
  }
  return (
    <div className="max-w-xl space-y-5">
      <form onSubmit={check} className="space-y-2">
        <label htmlFor="url" className="text-sm font-medium">Paste your BookMyShow movie URL</label>
        <div className="flex gap-2">
          <input id="url" className="field" value={raw} onChange={e => setRaw(e.target.value)} placeholder="https://in.bookmyshow.com/movies/hyderabad/…/ET00000000" />
          <button className="btn-primary shrink-0">Check link</button>
        </div>
        {err && <p role="alert" className="text-sm text-rose-300">{err}</p>}
      </form>
      {parsed && (
        <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
          <div className="flex gap-3">
            <Poster title={parsed.title} className="h-20 w-14 shrink-0" />
            <div>
              <p className="font-semibold">{parsed.title}</p>
              <p className="text-sm text-mute">{parsed.language}, {parsed.city}, {parsed.eventCode}</p>
              <p className="mt-1 text-xs text-mute">Read from the link. Poster and show details load once live checks are connected.</p>
            </div>
          </div>
          <label className="block space-y-1 text-sm">Notify me about
            <select className="field" value={mode} onChange={e => setMode(e.target.value as NotifyMode)}>
              <option value="all">Every availability change</option>
              <option value="opening">Only when booking opens</option>
              <option value="soldout_to_available">Only when sold-out shows reopen</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">Preferred theatres (comma separated, blank for all)
            <input className="field" value={theatres} onChange={e => setTheatres(e.target.value)} placeholder="PVR Hyderabad, AMB Cinemas" />
          </label>
          <fieldset className="space-y-1 text-sm"><legend>Show times</legend>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(p => (
                <button type="button" key={p} aria-pressed={times.includes(p)} onClick={() => setTimes(t => t.includes(p) ? t.filter(x => x !== p) : [...t, p])}
                  className={`btn rounded-full border px-3 py-1 ${times.includes(p) ? "border-violet bg-violet/15 text-violet" : "border-line text-mute"}`}>{p}</button>
              ))}
            </div>
          </fieldset>
          <button onClick={start} className="btn-primary w-full">Start tracking</button>
        </div>
      )}
    </div>
  );
}
