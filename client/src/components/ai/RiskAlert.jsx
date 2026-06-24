import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RiskAlert({ goalId, goalTitle, riskReason, forecast, onDismiss, className = '' }) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className={`overflow-hidden ${className}`}
        >
          <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-red-500/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-amber-400">⚠️ Forecast Intervention Required</h4>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mt-1">
                  {goalTitle}
                </p>

                {forecast ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 px-3 my-2.5 rounded-lg bg-black/35 border border-[var(--color-border-subtle)] text-xs">
                    <div>
                      <span className="text-[var(--color-text-muted)] block">Projected Completion</span>
                      <span className="font-semibold text-red-400">
                        {new Date(forecast.predictedCompletionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block">Deadline Date</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {new Date(forecast.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block">Estimated Delay</span>
                      <span className="font-semibold text-red-400">{forecast.estimatedDelay}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block">Success Probability</span>
                      <span className="font-semibold text-amber-400">{forecast.successProbability}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                    {riskReason}
                  </p>
                )}

                <p className="text-xs text-[var(--color-text-muted)] mt-1.5 mb-2">
                  AI recommends initiating Deadline Rescue to realign milestones and secure delivery.
                </p>

                <Link
                  to={`/goals/${goalId}/replan`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 mt-1 transition-colors"
                >
                  Initiate AI Deadline Rescue
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
