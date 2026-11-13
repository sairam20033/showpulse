export function ago(iso: string | null) {
  if (!iso) return "Never";
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? "Just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}
