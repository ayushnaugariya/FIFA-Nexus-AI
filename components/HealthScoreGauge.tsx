function statusFor(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Healthy', color: '#1B8A5A' };
  if (score >= 60) return { label: 'Watch', color: '#FFB627' };
  return { label: 'Needs attention', color: '#E14B4B' };
}

export function HealthScoreGauge({ score }: { score: number }) {
  const { label, color } = statusFor(score);
  return (
    <div role="status" aria-label={`Stadium health score ${score} out of 100, status ${label}`} className="flex items-center gap-4">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full border-4 font-display text-2xl"
        style={{ borderColor: color, color }}
      >
        {score}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-mist">Stadium health</p>
        <p className="font-display text-lg" style={{ color }}>
          {label}
        </p>
      </div>
    </div>
  );
}
