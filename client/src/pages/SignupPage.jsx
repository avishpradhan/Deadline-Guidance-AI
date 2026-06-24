import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../stores/authStore';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await signup(name, email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex text-left bg-[var(--color-navy-950)]">
      {/* Left: Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-emerald-600/10 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4 leading-tight text-white tracking-tight">
            Start your journey to <span className="gradient-text">zero missed deadlines</span>.
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
            Join Deadline Guardian AI today. Let our Gemini-powered engine analyze your workload, sync with your Google Calendar, and generate high-impact recovery plans.
          </p>
          
          <div className="glass-card-static p-4 border border-white/5 rounded-xl bg-white/[0.02]">
            <p className="text-xs text-[var(--color-text-secondary)] italic leading-relaxed">
              "Guardian AI stepped in, restructured my daily tasks, and kept me on track for a successful launch on Product Hunt by analyzing my capacity limits automatically."
            </p>
            <p className="text-[10px] text-indigo-400 font-bold mt-2">— User Case Study</p>
          </div>
        </motion.div>
      </div>

      {/* Right: Signup Form */}
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

          <h2 className="text-xl font-display font-bold text-white mb-1.5 tracking-tight">Create your account</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mb-6">
            Get your AI productivity coach in 30 seconds.
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
              label="Full Name"
              type="text"
              placeholder="Rohan Sharma"
              value={name}
              onChange={(e) => { clearError(); setName(e.target.value); }}
              required
              className="text-xs"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="rohan@example.com"
              value={email}
              onChange={(e) => { clearError(); setEmail(e.target.value); }}
              required
              className="text-xs"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => { clearError(); setPassword(e.target.value); }}
              required
              minLength={6}
              className="text-xs"
            />
            <Button
              type="submit"
              size="md"
              loading={isLoading}
              className="w-full mt-2 rounded-xl font-bold py-2.5"
              icon={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

