import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Stepper({ steps, currentStep, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Step circle */}
            <motion.div
              className={`
                flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold
                transition-all duration-300 border-2
                ${
                  isCompleted
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : isActive
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                    : 'bg-transparent border-[var(--color-border-default)] text-[var(--color-text-muted)]'
                }
              `}
              initial={false}
              animate={isCompleted ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
            </motion.div>

            {/* Step label */}
            <span
              className={`text-sm hidden sm:inline ${
                isActive
                  ? 'text-[var(--color-text-primary)] font-semibold'
                  : isCompleted
                  ? 'text-indigo-400'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {step}
            </span>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 rounded-full transition-colors duration-300 ${
                  isCompleted ? 'bg-indigo-500' : 'bg-[var(--color-navy-600)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
