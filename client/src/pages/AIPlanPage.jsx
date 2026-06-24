import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import RiskBadge from '../components/ui/RiskBadge';
import CoachingPulse from '../components/ai/CoachingPulse';
import useGoalStore from '../stores/goalStore';

const LOADING_MESSAGES = [
  'Analyzing your goal...',
  'Estimating risk and timeline...',
  'Breaking down tasks...',
  'Building your personalized plan...',
];

export default function AIPlanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { analyzeGoal, fetchGoalDetail } = useGoalStore();
  const [phase, setPhase] = useState('loading'); // loading | result | error
  const [messageIndex, setMessageIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    runAnalysis();
  }, [id]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2500);
    return () => clearInterval(timer);
  }, [phase]);

  const runAnalysis = async () => {
    setPhase('loading');
    setMessageIndex(0);
    try {
      const data = await analyzeGoal(id);
      if (data) {
        setResult(data);
        setPhase('result');
      } else {
        setError('Failed to generate plan. Please try again.');
        setPhase('error');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during analysis.');
      setPhase('error');
    }
  };

  return (
    <PageContainer maxWidth="max-w-[800px]">
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-[60vh] flex flex-col items-center justify-center text-center"
          >
            <CoachingPulse isActive size="lg" className="mb-8" />
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg text-[var(--color-text-secondary)] font-medium"
              >
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
            <div className="flex gap-1.5 mt-6">
              {LOADING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= messageIndex ? 'bg-indigo-500 scale-100' : 'bg-[var(--color-navy-600)] scale-75'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Result State */}
        {phase === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h1 className="text-2xl font-display font-bold">Your AI Plan is Ready</h1>
            </div>

            {/* Risk Score + Coach Note */}
            <Card variant="static" className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                    Goal Analysis
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {result.riskReason || 'Analysis complete.'}
                  </p>
                </div>
                <RiskBadge level={result.riskScore || 'medium'} pulse />
              </div>
              {result.coachNote && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/15">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <span className="text-indigo-400 font-semibold">Coach: </span>
                    {result.coachNote}
                  </p>
                </div>
              )}
            </Card>

            {/* Phase Breakdown */}
            {result.phases?.map((phase, pi) => (
              <motion.div
                key={pi}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + pi * 0.1 }}
                className="mb-4"
              >
                <Card variant="static">
                  <h4 className="font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                    <Badge variant="info">Phase {pi + 1}</Badge>
                    {phase.name}
                  </h4>
                  <div className="space-y-2">
                    {phase.tasks?.map((task, ti) => (
                      <div
                        key={ti}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-5 h-5 rounded-md border-2 border-[var(--color-border-default)] shrink-0" />
                          <span className="text-sm text-[var(--color-text-primary)] truncate">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedHours}h
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Start Plan CTA */}
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                icon={ArrowRight}
                onClick={() => navigate(`/goals/${id}`)}
              >
                Start Plan
              </Button>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[60vh] flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">Analysis Failed</h2>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">{error}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button onClick={runAnalysis}>Retry Analysis</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
