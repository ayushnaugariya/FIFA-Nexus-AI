export function Card({
  children,
  className = '',
  as: Tag = 'div',
  glow,
  ...rest
}: React.PropsWithChildren<{
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  glow?: 'gold' | 'green' | 'red';
}> &
  React.HTMLAttributes<HTMLElement>) {
  const Component = Tag as React.ElementType;

  const glowClass =
    glow === 'gold'
      ? 'border-floodlight/20 shadow-[0_0_30px_rgba(255,182,39,0.06)]'
      : glow === 'green'
        ? 'border-turf/20 shadow-[0_0_30px_rgba(27,138,90,0.06)]'
        : glow === 'red'
          ? 'border-clay/20 shadow-[0_0_30px_rgba(225,75,75,0.06)]'
          : '';

  return (
    <Component
      className={`card rounded-2xl p-6 ${glowClass} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
