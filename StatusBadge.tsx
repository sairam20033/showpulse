import type { Status } from "../types";
const MAP: Record<Status, { label: string; cls: string }> = {
  BOOKING_OPEN: { label: "Booking open", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
  AVAILABLE: { label: "Available", cls: "bg-azure/10 text-azure border-azure/30" },
  NOT_YET_OPEN: { label: "Not yet open", cls: "bg-violet/10 text-violet border-violet/30" },
  SOLD_OUT: { label: "Sold out", cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
  CHECK_FAILED: { label: "Check failed", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  PENDING: { label: "Not checked yet", cls: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30" },
};
export default function StatusBadge({ status }: { status: Status }) {
  const m = MAP[status];
  return <span className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}
