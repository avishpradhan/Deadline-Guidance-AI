import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  size = 'md',
  showLabel = true,
  riskAware = false,
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const barColor = useMemo(() => {
    if (!riskAware) return 'from-indigo-500 to-indigo-400';
    if (percentage >= 70) return 'from-emerald-500 to-emerald-400';
    if (percentage >= 40) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  }, [percentage, riskAware]);

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[var(--color-text-muted)]">Progress</span>
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`w-full ${heights[size]} bg-[var(--color-navy-700)] rounded-full overflow-hidden`}
      >
        <motion.div
          className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
