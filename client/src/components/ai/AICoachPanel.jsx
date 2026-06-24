import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import CoachingPulse from './CoachingPulse';

/**
 * AICoachPanel — Displays the AI coach message with typing animation.
 */
export default function AICoachPanel({
  message = '',
  isLoading = false,
  title = 'AI Coach',
  className = '',
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!message || isLoading) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < message.length) {
        setDisplayedText(message.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [message, isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card-static p-5 ${className}`}
    >
      <div className="flex items-start gap-4">
        <CoachingPulse isActive={isLoading || isTyping} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-indigo-400 mb-2">{title}</h4>
          {isLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-4/5" />
              <div className="skeleton h-3 w-3/5" />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle"
                />
              )}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
