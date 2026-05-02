// Server component — renders deterministic confetti pieces seeded by gameId
// so the same game doesn't re-shuffle on every render (avoiding hydration
// mismatches and re-firing the burst on auto-refresh polls).

const COLORS = [
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#facc15", // yellow-400
];

// Tiny deterministic RNG (mulberry32) so confetti positions are stable per seed.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function Confetti({
  seed,
  count = 36,
}: {
  seed: string;
  count?: number;
}) {
  const rng = mulberry32(hashString(seed));
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = rng() * 100;
    const drift = (rng() * 40 - 20).toFixed(1) + "vw";
    const delay = (rng() * 0.6).toFixed(2) + "s";
    const duration = (1.4 + rng() * 0.8).toFixed(2) + "s";
    const rot = Math.floor(rng() * 720 + 360) + "deg";
    const color = COLORS[Math.floor(rng() * COLORS.length)];
    const size = 6 + Math.floor(rng() * 8);
    const round = rng() > 0.5;
    return { i, left, drift, delay, duration, rot, color, size, round };
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0 overflow-visible"
    >
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute block animate-confetti"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: `${p.size}px`,
            height: `${p.size * (p.round ? 1 : 1.6)}px`,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            animationDelay: p.delay,
            animationDuration: p.duration,
            // CSS custom props feed the @keyframes confetti animation
            ["--cx" as string]: p.drift,
            ["--cr" as string]: p.rot,
          }}
        />
      ))}
    </div>
  );
}
