import { motion } from 'framer-motion';

const cardVariants = {
  default: 'glass-card',
  static: 'glass-card-static',
  alert: 'glass-card-static border-amber-500/30 bg-amber-500/5',
  danger: 'glass-card-static border-red-500/30 bg-red-500/5',
  success: 'glass-card-static border-emerald-500/30 bg-emerald-500/5',
};

export default function Card({
  children,
  variant = 'default',
  className = '',
  animate = true,
  padding = 'p-6',
  ...props
}) {
  const Component = animate ? motion.div : 'div';
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' },
      }
    : {};

  return (
    <Component
      className={`${cardVariants[variant]} ${padding} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}
