function statusFor(score: number): { label: string; color: string; ring: string; emoji: string } {
  if (score >= 85) return { label: 'Healthy', color: '#1B8A5A', ring: '#1B8A5A', emoji: '✅' };
  if (score >= 60) return { label: 'Watch', color: '#FFB627', ring: '#FFB627', emoji: '⚠️' };
  return { label: 'Needs Attention', color: '#E14B4B', ring: '#E14B4B', emoji: '🚨' };
}

export function HealthScoreGauge({ score }: { score: number }) {
  const { label, color, ring, emoji } = statusFor(score);
  const circumference = 2 * Math.PI * 36; // r=36
  const dashOffset = circumference - (circumference * score) / 100;

  return (
    <div
      role="status"
      aria-label={`Stadium health score ${score} out of 100, status ${label}`}
      className="flex items-center gap-4"
    >
      {/* SVG ring gauge */}
      <div className="relative flex-shrink-0">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          {/* Track */}
          <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          {/* Fill */}
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke={ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-extrabold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-mist">Stadium Health</p>
        <p className="font-display text-lg font-bold" style={{ color }}>
          {emoji} {label}
        </p>
        <p className="text-xs text-mist">out of 100</p>
      </div>
    </div>
  );
}
