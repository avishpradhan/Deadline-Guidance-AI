import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, MessageSquare, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AICoachPanel from '../components/ai/AICoachPanel';
import useGoalStore from '../stores/goalStore';
import { progressService } from '../services/progressService';
import { aiService } from '../services/aiService';
import { formatToday, getGreeting } from '../utils/dateUtils';
import useAuthStore from '../stores/authStore';

export default function CheckinPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchGoalDetail, currentGoal, tasks } = useGoalStore();
  const [checkedTasks, setCheckedTasks] = useState(new Set());
  const [blockerNote, setBlockerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    fetchGoalDetail(id);
  }, [id]);

  // Filter for today's pending tasks
  const todaysTasks = tasks.filter((t) => t.status !== 'completed');

  const toggleTask = (taskId) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const completedTasks = Array.from(checkedTasks);
      const today = new Date().toISOString().split('T')[0];

      // Submit check-in
      await progressService.submitCheckin(id, today, completedTasks, blockerNote);

      // Get AI response
      const aiResult = await aiService.checkinAnalyze(id, completedTasks, blockerNote);
      setAiResponse(aiResult?.message || aiResult?.aiResponse || 'Great work! Keep pushing forward.');
      setSubmitted(true);
    } catch (err) {
      setAiResponse('Check-in recorded. Keep going!');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <PageContainer maxWidth="max-w-[650px]">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="checkin-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-6 text-left"
          >
            {/* Header */}
            <div>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">{formatToday()}</p>
              <h1 className="text-xl md:text-2xl font-display font-bold mb-1 tracking-tight text-white">
                Daily Workspace Check-in
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {currentGoal
                  ? `Mark tasks completed today for "${currentGoal.title}".`
                  : 'Loading active tasks...'}
              </p>
            </div>

            {/* Checklist */}
            <Card variant="static" className="border-white/5 bg-white/[0.01]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Today's Tasks
              </h3>
              {todaysTasks.length > 0 ? (
                <div className="space-y-1">
                  {todaysTasks.map((task) => {
                    const isChecked = checkedTasks.has(task._id);
                    return (
                      <motion.button
                        key={task._id}
                        onClick={() => toggleTask(task._id)}
                        className="flex items-center gap-3 w-full py-3 px-3 rounded-lg hover:bg-white/5 transition-all text-left cursor-pointer text-xs"
                        whileTap={{ scale: 0.99 }}
                      >
                        <motion.div
                          animate={isChecked ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.2 }}
                        >
                          {isChecked ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-[var(--color-border-default)] shrink-0" />
                          )}
                        </motion.div>
                        <span
                          className={`font-semibold flex-1 transition-all ${
                            isChecked
                              ? 'line-through text-[var(--color-text-muted)]'
                              : 'text-[var(--color-text-primary)]'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 ml-4 font-bold bg-white/5 px-2 py-0.5 rounded">
                          {task.estimatedHours}h
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--color-text-muted)] font-medium">
                    No pending tasks found. All caught up today!
                  </p>
                </div>
              )}
            </Card>

            {/* Blockers */}
            <Card variant="static" className="border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Log Impediments or Blockers
                </h3>
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium">(optional)</span>
              </div>
              <Input
                type="textarea"
                placeholder="e.g. Flight delay / got stuck on algorithmic logic. AI Coach will dynamically adapt tomorrow's focus."
                value={blockerNote}
                onChange={(e) => setBlockerNote(e.target.value)}
                className="text-xs"
              />
            </Card>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <Button
                size="md"
                icon={ArrowRight}
                onClick={handleSubmit}
                loading={submitting}
                disabled={checkedTasks.size === 0 && !blockerNote}
                className="rounded-xl font-bold px-6 text-xs"
              >
                Submit Check-in ({checkedTasks.size}/{todaysTasks.length} tasks)
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Success Screen */
          <motion.div
            key="checkin-result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-1.5">Check-in Complete!</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {checkedTasks.size} of {todaysTasks.length} tasks logged completed today.
              </p>
            </div>

            <AICoachPanel
              message={aiResponse}
              title="AI Coach Response"
              className="w-full max-w-lg shadow-xl"
            />

            <div className="flex gap-3 justify-center text-xs font-bold">
              <Button variant="secondary" onClick={() => navigate(`/goals/${id}`)} className="rounded-xl">
                Go to Goal
              </Button>
              <Button onClick={() => navigate('/dashboard')} className="rounded-xl">
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
