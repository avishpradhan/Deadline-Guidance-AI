import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  RotateCcw,
  Trophy,
  Trash2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  ListTodo
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import RiskBadge from '../components/ui/RiskBadge';
import AIDecisionInsightCard from '../components/ai/AIDecisionInsightCard';
import CalendarIntelligenceCard from '../components/ai/CalendarIntelligenceCard';
import useGoalStore from '../stores/goalStore';
import { formatDate, formatRelativeDeadline, daysRemaining } from '../utils/dateUtils';
import { CATEGORY_ICONS } from '../utils/constants';

export default function GoalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentGoal, tasks, fetchGoalDetail, isLoading, clearCurrent, deleteGoal } = useGoalStore();
  const [goalData, setGoalData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadGoal = async () => {
    const data = await fetchGoalDetail(id);
    if (data) setGoalData(data);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteGoal(id);
    if (success) {
      navigate('/dashboard');
    } else {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    loadGoal();
    return () => clearCurrent();
  }, [id]);

  if (isLoading && !currentGoal) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <div className="skeleton h-8 w-64 animate-pulse" />
          <div className="skeleton h-32 w-full animate-pulse" />
          <div className="skeleton h-48 w-full animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  if (!currentGoal) {
    return (
      <PageContainer>
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <p className="text-[var(--color-text-muted)] mb-4 text-sm">Goal not found.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </PageContainer>
    );
  }

  const goal = currentGoal;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const total = tasks.length;
  const days = daysRemaining(goal.deadline);
  const needsReplan = goal.riskScore === 'high' || completed / (total || 1) < 0.3;

  // Group tasks by phase
  const phases = tasks.reduce((acc, task) => {
    const phase = task.phase || 'Tasks';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(task);
    return acc;
  }, {});

  return (
    <PageContainer maxWidth="max-w-[1200px]">
      {/* Header Info */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-2xl shrink-0">{CATEGORY_ICONS[goal.category] || '🎯'}</span>
            <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white">{goal.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(goal.deadline)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeDeadline(goal.deadline)}
            </span>
            <RiskBadge level={goal.riskScore || 'low'} pulse={goal.riskScore === 'high'} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/goals/${id}/checkin`}>
            <Button size="sm" icon={CheckCircle2} className="rounded-xl font-bold py-2">
              Log Progress
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Summary Card */}
      <Card variant="static" className="mb-6 border-white/5 bg-white/[0.01]">
        {/* Health & Forecast Diagnostics Grid */}
        {goal.intelligence && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 p-4 rounded-xl bg-black/20 border border-[var(--color-border-subtle)]">
            <div className="text-left">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold block mb-0.5">Health Score</span>
              <span className={`text-lg font-bold ${
                goal.intelligence.healthScore >= 80 ? 'text-emerald-400' :
                goal.intelligence.healthScore >= 60 ? 'text-indigo-400' :
                goal.intelligence.healthScore >= 40 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {goal.intelligence.healthScore}/100
              </span>
              <span className="text-[9px] text-[var(--color-text-secondary)] block mt-0.5 font-medium">
                {goal.intelligence.healthScore >= 80 ? 'Healthy pacing' :
                 goal.intelligence.healthScore >= 60 ? 'Needs attention' :
                 goal.intelligence.healthScore >= 40 ? 'High risk' : 'Critical state'}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold block mb-0.5">Success Odds</span>
              <span className={`text-lg font-bold ${
                goal.intelligence.successProbability >= 90 ? 'text-emerald-400' :
                goal.intelligence.successProbability >= 70 ? 'text-indigo-400' :
                goal.intelligence.successProbability >= 50 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {goal.intelligence.successProbability}%
              </span>
              <span className="text-[9px] text-[var(--color-text-secondary)] block mt-0.5 font-medium">
                {goal.intelligence.successProbability >= 90 ? 'Very likely' :
                 goal.intelligence.successProbability >= 70 ? 'Highly probable' :
                 goal.intelligence.successProbability >= 50 ? 'Timeline risk' : 'Severe delays'}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold block mb-0.5">Predicted Finish</span>
              <span className="text-sm font-bold text-[var(--color-text-primary)] block pt-0.5">
                {new Date(goal.intelligence.predictedCompletionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className={`text-[9px] block mt-0.5 font-bold ${
                goal.intelligence.daysAheadOrBehind < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {goal.intelligence.daysAheadOrBehind < 0 ? `${Math.abs(goal.intelligence.daysAheadOrBehind)} days behind` : 'On pacing schedule'}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold block mb-0.5">Forecast Confidence</span>
              <span className="text-sm font-bold text-indigo-400 block pt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                {goal.intelligence.confidence}%
              </span>
              <span className="text-[9px] text-[var(--color-text-secondary)] block mt-0.5 font-medium">Based on velocity logs</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-[var(--color-text-primary)]">
            {completed} of {total} tasks completed
          </span>
          <span className="text-[var(--color-text-muted)] font-medium">{days} days remaining</span>
        </div>
        <ProgressBar value={completed} max={total || 1} riskAware showLabel={false} />
      </Card>

      {/* Two Column SaaS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Phased Tasks List & AI Decision Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phased Tasks List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1 mb-1">
              Phased Action Steps ({total} tasks)
            </h3>
            {Object.entries(phases).map(([phaseName, phaseTasks], pi) => (
              <motion.div
                key={phaseName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.08 }}
              >
                <Card variant="static" className="border-white/5 bg-white/[0.01]">
                  <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <Badge variant="info">Phase {pi + 1}</Badge>
                    {phaseName}
                  </h3>
                  <div className="space-y-1">
                    {phaseTasks.map((task, ti) => (
                      <div
                        key={task._id || ti}
                        className={`flex items-center justify-between py-2.5 px-3 rounded-lg border border-transparent transition-all text-xs
                          ${task.status === 'completed' 
                            ? 'opacity-50 hover:opacity-75 bg-black/[0.05]' 
                            : 'hover:bg-white/5 hover:border-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-[var(--color-border-default)] shrink-0" />
                          )}
                          <span
                            className={`font-medium text-left ${
                              task.status === 'completed'
                                ? 'line-through text-[var(--color-text-muted)]'
                                : 'text-[var(--color-text-primary)]'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[10px] text-[var(--color-text-muted)]">
                          <span className="font-semibold">
                            {task.estimatedHours}h
                          </span>
                          {task.dueDate && (
                            <span className="px-2 py-0.5 rounded bg-white/5 font-semibold">
                              {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* AI Decision Intelligence Panel (Redesigned) */}
          <AIDecisionInsightCard
            insight={goal.aiDecisionInsight}
            isLoading={isLoading}
          />

          {tasks.length === 0 && (
            <Card variant="static" className="text-center py-10 border-white/5">
              <ListTodo className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-xs text-[var(--color-text-muted)]">No tasks generated yet for this goal.</p>
              <Link to={`/goals/${id}/analyze`}>
                <Button variant="secondary" size="sm" className="mt-4">
                  Generate Diagnostic Plan
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Right Sidebar Columns */}
        <div className="lg:col-span-1 space-y-6">
          {/* Synced Calendar conflicts intelligence widget */}
          <CalendarIntelligenceCard goalId={id} onSyncComplete={loadGoal} />

          {/* Quick Actions Panel */}
          <Card variant="static" className="border-white/5 bg-white/[0.01]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Goal Control Actions
            </h4>
            <div className="space-y-2.5">
              <Link to={`/goals/${id}/checkin`} className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start text-xs py-2.5 px-4 rounded-xl" icon={CheckCircle2}>
                  Perform Daily Check-in
                </Button>
              </Link>
              {needsReplan && (
                <Link to={`/goals/${id}/replan`} className="block animate-pulse">
                  <Button variant="secondary" size="sm" className="w-full justify-start text-xs text-amber-400 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 py-2.5 px-4 rounded-xl" icon={RotateCcw}>
                    Initiate Deadline Rescue
                  </Button>
                </Link>
              )}
              {completed === total && total > 0 && (
                <Link to={`/goals/${id}/complete`} className="block">
                  <Button variant="success" size="sm" className="w-full justify-start text-xs py-2.5 px-4 rounded-xl" icon={Trophy}>
                    Mark Goal Completed
                  </Button>
                </Link>
              )}
              <div className="pt-2.5 mt-2.5 border-t border-white/5">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full justify-start text-xs py-2.5 px-4 rounded-xl"
                  icon={Trash2}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Commitment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-950 border border-red-500/20 shadow-2xl p-6 z-10"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />

              <div className="flex items-start gap-4 mt-2 text-left">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Delete Goal?</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-white">"{goal.title}"</span>? This will permanently erase this goal, all of its tasks, daily progress logs, and AI-generated intelligence forecasts.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 text-xs font-semibold">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={isDeleting}
                  onClick={handleDelete}
                >
                  Delete Goal
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
