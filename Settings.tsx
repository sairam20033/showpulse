import { useState } from "react";
export default function Settings({ intervalMin, onInterval }: { intervalMin: number; onInterval: (n: number) => void }) {
  const [clicked, setClicked] = useState(false);
  return (
    <form onSubmit={e => { e.preventDefault(); setClicked(true); }} className="max-w-xl space-y-4">
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
        Telegram and email settings can't be saved yet. They'll be stored on the server once the backend is connected, never in the browser.
      </p>
      <label className="block space-y-1 text-sm">Telegram bot token<input type="password" autoComplete="off" className="field" placeholder="123456:ABC…" /></label>
      <label className="block space-y-1 text-sm">Telegram chat ID<input className="field" inputMode="numeric" /></label>
      <label className="block space-y-1 text-sm">City<input className="field" defaultValue="Hyderabad" /></label>
      <label className="block space-y-1 text-sm">Check every
        <select className="field" value={intervalMin} onChange={e => onInterval(Number(e.target.value))}>
          {[15, 30, 60, 120].map(n => <option key={n} value={n}>{n} minutes</option>)}
        </select>
      </label>
      <label className="block space-y-1 text-sm">Email for alerts (optional)<input type="email" className="field" /></label>
      <button className="btn-primary">Save settings</button>
      {clicked && <p className="text-sm text-mute">Nothing was saved. This form connects in Phase 6.</p>}
    </form>
  );
}
