export function Card({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: React.PropsWithChildren<{ className?: string; as?: keyof JSX.IntrinsicElements }> &
  React.HTMLAttributes<HTMLElement>) {
  const Component = Tag as React.ElementType;
  return (
    <Component className={`card rounded-card border border-white/10 bg-pitchnight2 p-5 ${className}`} {...rest}>
      {children}
    </Component>
  );
}
