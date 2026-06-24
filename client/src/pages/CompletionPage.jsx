import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AICoachPanel from '../components/ai/AICoachPanel';
import useGoalStore from '../stores/goalStore';

// Simple confetti particle
const Particle = ({ delay }) => {
  const colors = ['#6366F1', '#10B981', '#F59E0B', '#818CF8', '#34D399', '#FBBF24'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * 400 - 200;
  const rotation = Math.random() * 720 - 360;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ backgroundColor: color, left: '50%', top: '30%' }}
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -80, 200],
        x: [0, x * 0.5, x],
        rotate: rotation,
        scale: [1, 1.2, 0.5],
      }}
      transition={{ duration: 2, delay, ease: 'easeOut' }}
    />
  );
};

export default function CompletionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentGoal, tasks, fetchGoalDetail, completeGoal } = useGoalStore();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchGoalDetail(id);
  }, [id]);

  useEffect(() => {
    if (currentGoal && currentGoal.status !== 'completed') {
      completeGoal(id);
    }
    setCompleted(true);
  }, [currentGoal]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return (
    <PageContainer maxWidth="max-w-[600px]">
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Confetti */}
        {completed &&
          Array.from({ length: 30 }).map((_, i) => (
            <Particle key={i} delay={i * 0.05} />
          ))}

        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 flex items-center justify-center mb-8 border border-amber-500/20 relative z-10"
        >
          <Trophy className="w-12 h-12 text-amber-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-display font-bold mb-3 gradient-text relative z-10"
        >
          Goal Completed!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[var(--color-text-secondary)] mb-8 relative z-10"
        >
          {currentGoal?.title || 'Your goal'} — crushed it.
        </motion.p>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full relative z-10"
        >
          <Card variant="static" className="text-left mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Tasks Completed</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {completedTasks}/{totalTasks}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Duration</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {currentGoal?.totalDays || '—'} days
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <AICoachPanel
            message="You stayed consistent and showed up every day. That discipline is the real skill — not just the result. Time for your next challenge."
            title="Coach's Final Note"
            className="mb-8"
          />

          <div className="flex justify-center">
            <Button
              size="lg"
              icon={Sparkles}
              onClick={() => navigate('/goals/new')}
            >
              Start a New Goal
            </Button>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
