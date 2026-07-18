export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-mist" role="status" aria-label={label || 'Loading'}>
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 rounded-full border-2 border-white/20 border-t-floodlight animate-spin flex-shrink-0"
      />
      {label && <span>{label}</span>}
    </span>
  );
}
