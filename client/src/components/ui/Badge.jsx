const badgeStyles = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  high: 'bg-red-500/15 text-red-400 border-red-500/25',
  critical: 'bg-red-500/20 text-red-300 border-red-400/30',
  info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  default: 'bg-[var(--color-navy-700)] text-[var(--color-text-secondary)] border-[var(--color-border-default)]',
};

export default function Badge({
  children,
  variant = 'default',
  dot = false,
  pulse = false,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold
        rounded-full border
        ${badgeStyles[variant] || badgeStyles.default}
        ${className}
      `}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                variant === 'high' || variant === 'critical'
                  ? 'bg-red-400'
                  : variant === 'medium'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              variant === 'high' || variant === 'critical'
                ? 'bg-red-400'
                : variant === 'medium'
                ? 'bg-amber-400'
                : variant === 'low'
                ? 'bg-emerald-400'
                : 'bg-indigo-400'
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
}
