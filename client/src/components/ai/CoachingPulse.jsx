import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

/**
 * CoachingPulse — Signature animated ring around the AI avatar.
 * Pulses when Gemini is actively analyzing.
 */
export default function CoachingPulse({ isActive = false, size = 'md', className = '' }) {
  const sizes = {
    sm: { outer: 'w-10 h-10', inner: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { outer: 'w-14 h-14', inner: 'w-11 h-11', icon: 'w-5 h-5' },
    lg: { outer: 'w-20 h-20', inner: 'w-16 h-16', icon: 'w-7 h-7' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer pulse rings */}
      {isActive && (
        <>
          <motion.div
            className={`absolute ${s.outer} rounded-full border-2 border-indigo-500/40`}
            animate={{
              scale: [1, 1.4, 1.4],
              opacity: [0.6, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className={`absolute ${s.outer} rounded-full border-2 border-indigo-400/30`}
            animate={{
              scale: [1, 1.6, 1.6],
              opacity: [0.4, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.4,
            }}
          />
          <motion.div
            className={`absolute ${s.outer} rounded-full border border-indigo-300/20`}
            animate={{
              scale: [1, 1.8, 1.8],
              opacity: [0.3, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.8,
            }}
          />
        </>
      )}

      {/* Idle breathing ring */}
      {!isActive && (
        <motion.div
          className={`absolute ${s.outer} rounded-full border border-indigo-500/20`}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Avatar circle */}
      <motion.div
        className={`
          relative ${s.inner} rounded-full
          bg-gradient-to-br from-indigo-500 to-indigo-600
          flex items-center justify-center
          shadow-lg
          ${isActive ? 'shadow-indigo-500/40' : 'shadow-indigo-500/20'}
        `}
        animate={isActive ? { boxShadow: ['0 0 20px rgba(99,102,241,0.3)', '0 0 40px rgba(99,102,241,0.5)', '0 0 20px rgba(99,102,241,0.3)'] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Bot className={`${s.icon} text-white`} />
      </motion.div>
    </div>
  );
}
