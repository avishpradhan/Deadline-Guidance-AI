import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Shield } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
          <Shield className="w-10 h-10 text-indigo-400 opacity-50" />
        </div>
        <h1 className="text-6xl font-display font-bold gradient-text mb-4">404</h1>
        <h2 className="text-xl font-display font-bold mb-2">Page Not Found</h2>
        <p className="text-[var(--color-text-secondary)] mb-8">
          This page seems to have missed its own deadline.
        </p>
        <Link to="/dashboard">
          <Button icon={Home}>Back to Dashboard</Button>
        </Link>
      </motion.div>
    </div>
  );
}
