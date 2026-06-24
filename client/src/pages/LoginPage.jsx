import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex text-left bg-[var(--color-navy-950)]">
      {/* Left: Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4 leading-tight text-white tracking-tight">
            Never let important deadlines <span className="gradient-text">drift away</span>.
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
            Deadline Guardian AI is a Gemini-powered strategic planner. We map your projects, startup milestones, work deadlines, and exams into capacity-aware daily checklists.
          </p>
          <div className="flex flex-col gap-3">
            {[
              'Autonomous goal decomposition & task mapping',
              'Proactive capacity-aware calendar sync overlays',
              'Real-time risk scoring & automated rescue intervention',
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">
              Deadline <span className="text-indigo-400">Guardian</span>
            </span>
          </div>

          <h2 className="text-xl font-display font-bold text-white mb-1.5 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mb-6">
            Log in to monitor and realign your active commitments.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => { clearError(); setEmail(e.target.value); }}
              required
              className="text-xs"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { clearError(); setPassword(e.target.value); }}
              required
              className="text-xs"
            />
            <Button
              type="submit"
              size="md"
              loading={isLoading}
              className="w-full mt-2 rounded-xl font-bold py-2.5"
              icon={ArrowRight}
            >
              Login to Dashboard
            </Button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
            New to Guardian?{' '}
            <Link to="/signup" className="text-indigo-400 font-bold hover:text-indigo-300">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
