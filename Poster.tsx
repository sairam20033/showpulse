export default function Poster({ title, className = "" }: { title: string; className?: string }) {
  const initials = title.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
  return (
    <div className={`grid place-items-center rounded-lg bg-gradient-to-br from-violet/40 to-azure/30 text-lg font-semibold text-white/90 ${className}`} aria-hidden>
      {initials}
    </div>
  );
}
