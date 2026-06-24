import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Clock, CheckCircle2, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import RiskBadge from '../components/ui/RiskBadge';
import CoachingPulse from '../components/ai/CoachingPulse';
import useGoalStore from '../stores/goalStore';
import { aiService } from '../services/aiService';

export default function ReplanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchGoalDetail, currentGoal, tasks } = useGoalStore();
  const [loading, setLoading] = useState(true);
  const [recoveryPlan, setRecoveryPlan] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadAndReplan();
  }, [id]);

  const loadAndReplan = async () => {
    setLoading(true);
    await fetchGoalDetail(id);
    const missedTasks = tasks
      .filter((t) => t.status !== 'completed')
      .map((t) => t._id);
    try {
      const data = await aiService.replan(id, missedTasks);
      setRecoveryPlan(data?.recoveryPlan || data);
    } catch {
      setRecoveryPlan({
        message: 'Unable to generate recovery plan. Please try again later.',
        currentProgress: 'Goal analysis is temporarily unavailable.',
        riskAssessment: 'Deadline risk is elevated due to pending milestones.',
        rescueStrategy: 'Review and consolidate remaining tasks manually.',
        recoveredTimeline: 'Try to increase daily effort to stay on schedule.',
        revisedTasks: []
      });
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const revisedTasks = recoveryPlan?.revisedTasks || [];
      await aiService.acceptReplan(id, revisedTasks);
      navigate(`/goals/${id}`);
    } catch (err) {
      console.error('Failed to activate rescue plan:', err);
      navigate(`/goals/${id}`);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-[750px]">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <CoachingPulse isActive size="lg" className="mb-4" />
          <p className="text-xs text-[var(--color-text-secondary)] font-medium">Formulating AI Deadline Rescue plan...</p>
        </div>
      </PageContainer>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length || 1;
  const missedCount = totalCount - completedCount;

  return (
    <PageContainer maxWidth="max-w-[750px]">
      {/* Title Header */}
      <div className="mb-6 text-left">
        <div className="flex items-center gap-2.5 mb-1.5">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white">
            Deadline Rescue Intervention
          </h1>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Proactive AI restructuring to recover your commitment timeline and prevent deadline drift.
        </p>
      </div>

      {/* Grid: Health diagnostic + Risk Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Health Diagnostic Card */}
        <Card variant="static" className="flex flex-col justify-between border-white/5 bg-white/[0.01] text-left">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                Deadline Health
              </h3>
              {currentGoal?.intelligence?.healthScore ? (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  currentGoal.intelligence.healthScore >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                  currentGoal.intelligence.healthScore >= 60 ? 'bg-indigo-500/15 text-indigo-400' :
                  currentGoal.intelligence.healthScore >= 40 ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'
                }`}>
                  {currentGoal.intelligence.healthScore}/100
                </span>
              ) : (
                <RiskBadge level={currentGoal?.riskScore || 'high'} pulse={currentGoal?.riskScore === 'high'} />
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-medium mb-1.5">
                <span>Completed Tasks</span>
                <span>{completedCount} of {totalCount} ({Math.round((completedCount/totalCount)*100)}%)</span>
              </div>
              <ProgressBar value={completedCount} max={totalCount} riskAware size="sm" />
            </div>
          </div>
          
          <div className="text-[11px] text-[var(--color-text-secondary)] bg-black/25 p-3 rounded-lg border border-white/5 leading-relaxed">
            <span className="font-bold text-indigo-400">Current Progress: </span>
            {recoveryPlan?.currentProgress || `${completedCount} tasks completed, ${missedCount} pending tasks require urgent rescheduling.`}
          </div>
        </Card>

        {/* Risk Drivers Card */}
        <Card variant="static" className="border-red-500/20 bg-gradient-to-br from-red-500/[0.03] to-transparent flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 text-red-400 mb-3.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">AI Risk Drivers</h3>
            </div>
            {recoveryPlan?.riskDrivers?.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {recoveryPlan.riskDrivers.map((driver, idx) => (
                  <li key={idx} className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {recoveryPlan?.riskAssessment || `You have fallen behind on ${missedCount} task${missedCount !== 1 ? 's' : ''}. Without recovery intervention, completing "${currentGoal?.title}" by the deadline is highly unlikely.`}
              </p>
            )}
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] border-t border-white/5 pt-2 font-semibold">
            Original Deadline: <span className="text-[var(--color-text-primary)] font-bold">{new Date(currentGoal?.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </Card>
      </div>

      {/* Proactive Rescue Strategy & Recovered Timeline */}
      {recoveryPlan && (
        <Card variant="static" className="mb-6 border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.03] to-emerald-500/[0.02] text-left">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Rescue Strategy</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Reprioritization Plan</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {recoveryPlan.rescueStrategy || recoveryPlan.message}
              </p>
            </div>

            {recoveryPlan.recoveredTimeline && (
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Recovered Pacing Projection</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {recoveryPlan.recoveredTimeline}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Rescue Impact Simulator */}
      {recoveryPlan && typeof recoveryPlan.successProbabilityBefore === 'number' && (
        <Card variant="static" className="mb-6 border-emerald-500/25 bg-white/[0.01]">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-1.5 text-left">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            AI Rescue Impact Simulation
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center items-center text-xs">
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
              <span className="text-[9px] text-[var(--color-text-muted)] block uppercase tracking-wider font-semibold">Without Rescue</span>
              <span className="text-lg font-bold text-red-400 block mt-1">
                {recoveryPlan.successProbabilityBefore}%
              </span>
              <span className="text-[8px] text-[var(--color-text-secondary)] block mt-0.5">Success Odds</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                +{recoveryPlan.improvement}%
              </span>
              <span className="text-[8px] text-[var(--color-text-muted)] mt-1.5 block uppercase tracking-wider font-semibold">Improvement</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-[9px] text-[var(--color-text-muted)] block uppercase tracking-wider font-semibold">With Rescue</span>
              <span className="text-lg font-bold text-emerald-400 block mt-1">
                {recoveryPlan.successProbabilityAfter}%
              </span>
              <span className="text-[8px] text-[var(--color-text-secondary)] block mt-0.5">Success Odds</span>
            </div>
          </div>
        </Card>
      )}

      {/* Constraints Factored In Panel */}
      {currentGoal?.constraints?.length > 0 && (
        <Card variant="static" className="mb-6 border-indigo-500/20 bg-indigo-950/20 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Goal Constraints Factored In</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {currentGoal.constraints.map((c, index) => (
              <div key={index} className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white capitalize">{c.type.replace('_', ' ')}:</span> {c.title}
                  {c.notes && <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5">{c.notes}</p>}
                </div>
                <div className="text-[9px] text-indigo-300 font-bold mt-1.5">
                  Date: {new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} {c.duration && `| Duration: ${c.duration}`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Plan: Revised Tasks */}
      <Card variant="static" className="mb-6 text-left border-white/5 bg-white/[0.01]">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Proposed Rescue Task Pipeline
        </h3>

        {recoveryPlan?.revisedTasks?.length > 0 ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {recoveryPlan.revisedTasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.01] hover:bg-white/5 border border-white/5 hover:border-indigo-500/10 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="success">Task {i + 1}</Badge>
                  <span className="text-xs text-[var(--color-text-primary)] font-semibold">{task.title}</span>
                </div>
                
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {task.estimatedHours}h
                  </span>
                  {task.dueDate && (
                    <Badge variant="info">
                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
            No revised tasks generated. Check if you have any pending tasks left.
          </p>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 text-xs font-bold">
        <Button variant="secondary" onClick={() => navigate(`/goals/${id}`)} className="rounded-xl">
          Discard and Keep Plan
        </Button>
        <Button onClick={handleAccept} loading={accepting} icon={RotateCcw} className="rounded-xl">
          Activate Rescue Plan
        </Button>
      </div>
    </PageContainer>
  );
}
