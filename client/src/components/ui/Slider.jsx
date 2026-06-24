export default function Slider({
  label,
  min = 0.5,
  max = 8,
  step = 0.5,
  value,
  onChange,
  helperText,
  className = '',
  id,
}) {
  const sliderId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label
            htmlFor={sliderId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
          <span className="text-sm font-bold text-indigo-400">
            {value} hrs/day
          </span>
        </div>
      )}
      <div className="relative">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-[var(--color-navy-700)]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-indigo-500
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-indigo-300
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-indigo-500/40
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:duration-150
            [&::-webkit-slider-thumb]:hover:scale-110
          "
          style={{
            background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${percentage}%, var(--color-navy-700) ${percentage}%, var(--color-navy-700) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-[var(--color-text-muted)]">{min}h</span>
          <span className="text-xs text-[var(--color-text-muted)]">{max}h</span>
        </div>
      </div>
      {helperText && (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      )}
    </div>
  );
}
