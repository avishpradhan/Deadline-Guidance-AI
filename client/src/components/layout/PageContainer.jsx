import { motion } from 'framer-motion';

export default function PageContainer({ children, className = '', maxWidth = 'max-w-[1200px]' }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        w-full ${maxWidth} mx-auto
        px-[var(--spacing-page)] py-8
        pb-24 md:pb-8
        ${className}
      `}
    >
      {children}
    </motion.main>
  );
}
