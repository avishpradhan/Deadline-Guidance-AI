import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  error,
  helperText,
  className = '',
  id,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--color-text-secondary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full px-4 py-3 rounded-xl appearance-none cursor-pointer
            bg-[var(--color-navy-800)] 
            border ${error ? 'border-red-500/50' : 'border-[var(--color-border-default)]'}
            text-[var(--color-text-primary)]
            transition-all duration-200
            focus:outline-none focus:border-indigo-500/60 focus:shadow-[var(--shadow-glow-sm)]
            pr-10
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      )}
    </div>
  );
}
