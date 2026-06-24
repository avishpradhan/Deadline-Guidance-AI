import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  error,
  helperText,
  className = '',
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const isTextarea = type === 'textarea';
  const Component = isTextarea ? 'textarea' : 'input';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-text-secondary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Component
          id={inputId}
          type={isTextarea ? undefined : inputType}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-[var(--color-navy-800)] 
            border ${error ? 'border-red-500/50' : 'border-[var(--color-border-default)]'}
            text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]
            transition-all duration-200
            focus:outline-none focus:border-indigo-500/60 focus:shadow-[var(--shadow-glow-sm)]
            ${isPassword ? 'pr-12' : ''}
            ${isTextarea ? 'min-h-[100px] resize-y' : ''}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      )}
    </div>
  );
}
