const LEVEL_STYLES: Record<string, string> = {
  low: 'bg-turf/20 text-turf border-turf/40',
  moderate: 'bg-floodlight/20 text-floodlight border-floodlight/40',
  high: 'bg-clay/20 text-clay border-clay/40',
  critical: 'bg-clay text-pitchnight border-clay',
  medium: 'bg-floodlight/20 text-floodlight border-floodlight/40',
};

export function Badge({ level, children }: { level: string; children: React.ReactNode }) {
  const style = LEVEL_STYLES[level] ?? 'bg-mist/20 text-mist border-mist/40';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${style}`}>
      {children}
    </span>
  );
}
