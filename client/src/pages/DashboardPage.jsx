import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Activity,
  TrendingUp,
  ListTodo,
  TrendingDown,
  ChevronRight,
  ShieldAlert,
  Calendar,
  CheckCircle
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import RiskBadge from '../components/ui/RiskBadge';
import Badge from '../components/ui/Badge';
import AICoachPanel from '../components/ai/AICoachPanel';
import RiskAlert from '../components/ai/RiskAlert';
import useAuthStore from '../stores/authStore';
import useGoalStore from '../stores/goalStore';
import { getGreeting, formatRelativeDeadline, isToday } from '../utils/dateUtils';
import { CATEGORY_ICONS } from '../utils/constants';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { goals, fetchGoals, isLoading } = useGoalStore();
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  useEffect(() => {
    fetchGoals();
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setDashboard(data);
    } catch {
      // Gracefully degrade
    } finally {
      setDashLoading(false);
    }
  };

  const activeGoals = goals.filter((g) => g.status === 'active' || g.status === 'planning');
  const todaysTasks = dashboard?.todaysTasks || [];
  const riskAlerts = dashboard?.riskAlerts || [];
  const aiRecommendation = dashboard?.aiRecommendation || '';
  const aiFocusOrder = dashboard?.aiFocusOrder || [];
  const firstName = user?.name?.split(' ')[0] || 'there';

  const criticalGoals = [...activeGoals].sort((a, b) => {
    const prioOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aPrio = prioOrder[a.priority] || 0;
    const bPrio = prioOrder[b.priority] || 0;
    if (aPrio !== bPrio) return bPrio - aPrio;
    
    const riskOrder = { high: 3, medium: 2, low: 1, null: 0 };
    const aRisk = riskOrder[a.riskScore] || 0;
    const bRisk = riskOrder[b.riskScore] || 0;
    return bRisk - aRisk;
  });

  const recoveryNeededGoals = activeGoals.filter((g) => {
    return g.riskScore === 'high' || (g.intelligence && g.intelligence.daysAheadOrBehind < 0);
  });

  useEffect(() => {
    if (criticalGoals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(criticalGoals[0]._id);
    }
  }, [goals]);

  const selectedGoal = goals.find(g => g._id === selectedGoalId) || criticalGoals[0];

  // Compute KPI metrics for the summary row
  const healthScores = activeGoals
    .filter((g) => g.intelligence?.healthScore !== undefined)
    .map((g) => g.intelligence.healthScore);
  const avgHealthScore = healthScores.length > 0
    ? Math.round(healthScores.reduce((sum, val) => sum + val, 0) / healthScores.length)
    : null;

  const activeRisksCount = activeGoals.filter((g) => g.riskScore === 'high').length;
  const upcomingDeadlinesCount = activeGoals.length;

  const totalTasksCount = activeGoals.reduce((sum, g) => sum + (g.progress?.total || 0), 0);
  const completedTasksCount = activeGoals.reduce((sum, g) => sum + (g.progress?.completed || 0), 0);
  const taskStreak = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Empty state
  if (!isLoading && !dashLoading && activeGoals.length === 0) {
    return (
      <PageContainer maxWidth="max-w-[900px]">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center mb-6 border border-indigo-500/20">
              <Target className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">
              {getGreeting()}, {firstName}!
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-md mx-auto mb-8 text-sm leading-relaxed">
              From work deliverables and startup launches to personal commitments, events, and exams,
              Deadline Guardian maps out daily schedules and keeps you accountable before deadlines are missed.
            </p>
            <Link to="/goals/new">
              <Button size="lg" icon={Plus}>
                Create Your First Goal
              </Button>
            </Link>
          </motion.div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="max-w-[1200px]">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1 tracking-tight">
            {getGreeting()}, {firstName}.
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Here's your strategic focus today.
          </p>
        </div>
        <Link to="/goals/new">
          <Button icon={Plus} size="md" className="rounded-xl font-semibold">
            New Goal
          </Button>
        </Link>
      </div>

      {/* Top KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="static" padding="p-4" className="flex flex-col justify-between bg-white/[0.01] border-white/5 shadow-md">
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Decision Health</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold ${
              avgHealthScore === null ? 'text-[var(--color-text-muted)]' :
              avgHealthScore >= 80 ? 'text-emerald-400' :
              avgHealthScore >= 60 ? 'text-indigo-400' :
              avgHealthScore >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>{avgHealthScore !== null ? `${avgHealthScore}%` : 'N/A'}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">overall pacing</span>
          </div>
        </Card>
        <Card variant="static" padding="p-4" className="flex flex-col justify-between bg-white/[0.01] border-white/5 shadow-md">
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Active Risks</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold ${
              activeRisksCount > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            }`}>{activeRisksCount}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{activeRisksCount === 1 ? 'goal' : 'goals'} at risk</span>
          </div>
        </Card>
        <Card variant="static" padding="p-4" className="flex flex-col justify-between bg-white/[0.01] border-white/5 shadow-md">
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Active Deadlines</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-indigo-400">{upcomingDeadlinesCount}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{upcomingDeadlinesCount === 1 ? 'commitment' : 'commitments'}</span>
          </div>
        </Card>
        <Card variant="static" padding="p-4" className="flex flex-col justify-between bg-white/[0.01] border-white/5 shadow-md">
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Tasks Streak</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-emerald-400">{taskStreak}%</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">tasks done</span>
          </div>
        </Card>
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {riskAlerts.map((alert, i) => (
            <RiskAlert
              key={i}
              goalId={alert.goalId}
              goalTitle={alert.goalTitle}
              riskReason={alert.riskReason}
              forecast={alert.forecast}
            />
          ))}
        </div>
      )}

      {/* Recovery Needed Section */}
      {recoveryNeededGoals.length > 0 && (
        <div className="mb-8 text-left">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Immediate Rescue Required
            </h3>
            <Badge variant="danger">{recoveryNeededGoals.length}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recoveryNeededGoals.map((goal) => (
              <Card key={goal._id} variant="static" className="border-red-500/20 bg-gradient-to-br from-red-950/10 via-transparent to-transparent flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                    <span>{CATEGORY_ICONS[goal.category] || '🎯'}</span>
                    <span className="truncate">{goal.title}</span>
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                    Projected delay: <span className="text-red-400 font-semibold">{Math.abs(goal.intelligence?.daysAheadOrBehind || 0)} days behind schedule</span>.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">
                    Probability: {goal.intelligence?.successProbability || 0}%
                  </span>
                  <Link to={`/goals/${goal._id}/replan`}>
                    <Button variant="outline" size="sm" className="!text-amber-400 !border-amber-500/30 hover:!bg-amber-500/10 py-1 px-3">
                      Rescue Plan
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main SaaS Dashboard Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: AI Diagnostics & Focus (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Decision Insight Card */}
          {selectedGoal && selectedGoal.aiDecisionInsight && (
            <Card variant="static" className="border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-primary)] to-[var(--color-navy-950)]/70 shadow-xl overflow-hidden animate-fade-in-up">
              {/* Header inside card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Decision Coach</h2>
                </div>
                
                {/* Tab selector */}
                {criticalGoals.length > 1 && (
                  <div className="flex flex-wrap gap-1 bg-black/35 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto">
                    {criticalGoals.slice(0, 3).map((g) => (
                      <button
                        key={g._id}
                        onClick={() => setSelectedGoalId(g._id)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedGoal._id === g._id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-[var(--color-text-muted)] hover:text-white'
                        }`}
                      >
                        {g.title.length > 15 ? `${g.title.slice(0, 15)}...` : g.title}
                      </button>
                    ))}
                    {criticalGoals.length > 3 && (
                      <span className="px-2 py-1 text-[9px] text-[var(--color-text-muted)] flex items-center">
                        +{criticalGoals.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Main Diagnostic Body */}
              <div className="pt-4 space-y-5 text-left">
                {/* 1. Goal Projection */}
                <div>
                  <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Diagnostic Pacing</h3>
                  <p className="text-sm text-[var(--color-text-primary)] mt-1.5 leading-relaxed font-medium">
                    {selectedGoal.aiDecisionInsight.goalForecast || selectedGoal.aiDecisionInsight.summary || 'Coaching insights are compiling...'}
                  </p>
                </div>

                {/* 2. Recommended Action */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden">
                  <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Quantified Corrective Action
                  </h3>
                  <p className="text-sm text-white mt-2 leading-relaxed font-semibold">
                    {selectedGoal.aiDecisionInsight.highestImpactAction?.action || selectedGoal.aiDecisionInsight.recommendation || 'No corrective action required.'}
                  </p>

                  {/* Impact probability shift */}
                  {selectedGoal.aiDecisionInsight.highestImpactAction?.beforeProbability !== undefined && (
                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-indigo-500/20 text-xs">
                      <span className="text-indigo-200">Probability Improvement:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-red-400">{selectedGoal.aiDecisionInsight.highestImpactAction.beforeProbability}%</span>
                        <span className="text-indigo-300">➔</span>
                        <span className="text-emerald-400">{selectedGoal.aiDecisionInsight.highestImpactAction.afterProbability}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Strategic Reasoning */}
                {selectedGoal.aiDecisionInsight.reasoning && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Strategic Reasoning</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed whitespace-pre-line">
                      {selectedGoal.aiDecisionInsight.reasoning}
                    </p>
                  </div>
                )}

                {/* Footer Link to Details */}
                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <Link to={`/goals/${selectedGoal._id}`} className="text-xs text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-1 group">
                    View Goal Control Center
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Today's Tasks */}
          <Card variant="static" className="border-white/5">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Today's Execution Checklist
                </h3>
                {todaysTasks.length > 0 && (
                  <Badge variant="info">{todaysTasks.length}</Badge>
                )}
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                {isToday(new Date()) ? 'Updated today' : ''}
              </span>
            </div>

            {todaysTasks.length > 0 ? (
              <div className="flex flex-col gap-2">
                {todaysTasks.slice(0, 5).map((task, i) => (
                  <motion.div
                    key={task._id || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-[var(--color-border-default)]'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span
                        className={`font-medium ${
                          task.status === 'completed'
                            ? 'line-through text-[var(--color-text-muted)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 ml-4">
                      {task.estimatedHours}h estimated
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">
                {dashLoading ? (
                  <span className="flex flex-col gap-2">
                    <span className="skeleton h-3 w-full" />
                    <span className="skeleton h-3 w-3/4" />
                  </span>
                ) : (
                  'No tasks due today. Complete a check-in on a goal detail page to get started.'
                )}
              </p>
            )}
          </Card>

          {/* AI Recommendation */}
          <div className="col-span-1">
            <AICoachPanel
              message={aiRecommendation || "Create a goal to get personalized AI coaching recommendations."}
              isLoading={dashLoading}
              title="Global AI Recommendations"
            />
          </div>
        </div>

        {/* Right Column: Sidebar Statistics (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">

          {/* Success Odds Dial (for Selected Goal) */}
          {selectedGoal && selectedGoal.aiDecisionInsight && (
            <Card variant="static" className="border-white/5 flex flex-col items-center justify-center p-5 text-center bg-white/[0.01]">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Success Odds</span>
              
              {/* Dial Wrapper */}
              <div className="relative w-24 h-24 mt-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={(selectedGoal.aiDecisionInsight.confidenceScore ?? selectedGoal.aiDecisionInsight.confidence ?? 0) >= 85 ? '#10B981' : (selectedGoal.aiDecisionInsight.confidenceScore ?? selectedGoal.aiDecisionInsight.confidence ?? 0) >= 70 ? '#6366F1' : '#F59E0B'}
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (selectedGoal.aiDecisionInsight.confidenceScore ?? selectedGoal.aiDecisionInsight.confidence ?? 0) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-white leading-none">
                    {selectedGoal.aiDecisionInsight.confidenceScore ?? selectedGoal.aiDecisionInsight.confidence ?? 0}%
                  </span>
                  <span className="text-[8px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">probability</span>
                </div>
              </div>

              {/* Day-over-day delta change widget */}
              {selectedGoal.aiDecisionInsight.insightDelta && selectedGoal.aiDecisionInsight.insightDelta.probabilityChange !== 0 && (
                <div className={`mt-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                  selectedGoal.aiDecisionInsight.insightDelta.probabilityChange >= 0
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}>
                  {selectedGoal.aiDecisionInsight.insightDelta.probabilityChange >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {selectedGoal.aiDecisionInsight.insightDelta.probabilityChange >= 0 ? '+' : ''}
                  {selectedGoal.aiDecisionInsight.insightDelta.probabilityChange}% since yesterday
                </div>
              )}

              {/* Explanatory text */}
              {selectedGoal.aiDecisionInsight.insightDelta?.explanation && (
                <p className="text-[10px] text-[var(--color-text-muted)] italic mt-2 px-2 leading-relaxed">
                  "{selectedGoal.aiDecisionInsight.insightDelta.explanation}"
                </p>
              )}
            </Card>
          )}

          {/* Selected Goal Risk Drivers & Changes */}
          {selectedGoal && selectedGoal.aiDecisionInsight && (
            <div className="space-y-4">
              {/* Risk Drivers */}
              {selectedGoal.aiDecisionInsight.riskDrivers && selectedGoal.aiDecisionInsight.riskDrivers.length > 0 && (
                <Card variant="static" padding="p-4" className="border-white/5 text-xs">
                  <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">
                    Strategic Risk Drivers
                  </h4>
                  <div className="space-y-2">
                    {selectedGoal.aiDecisionInsight.riskDrivers.map((driver, idx) => {
                      const isNeg = driver.type === 'negative';
                      return (
                        <div key={idx} className="flex gap-2 items-start leading-relaxed text-[var(--color-text-secondary)]">
                          {isNeg ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          <span>{driver.factor}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Change Drivers */}
              {selectedGoal.aiDecisionInsight.changeDrivers && selectedGoal.aiDecisionInsight.changeDrivers.length > 0 && (
                <Card variant="static" padding="p-4" className="border-white/5 text-xs">
                  <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">
                    What Changed Recently
                  </h4>
                  <div className="space-y-2">
                    {selectedGoal.aiDecisionInsight.changeDrivers.map((driver, idx) => {
                      const isPos = (driver.impact || 0) >= 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-[11px] font-medium text-[var(--color-text-primary)]">
                          <span className="truncate pr-2">{driver.factor}</span>
                          <span className={`font-bold shrink-0 ${isPos ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isPos ? '+' : ''}{driver.impact}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* AI Focus Order Priority Advisor */}
          <Card variant="static" padding="p-4" className="border-white/5 text-xs">
            <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              AI Priority Advisor
            </h3>
            <p className="text-[10px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              Focus on these commitments first based on risk.
            </p>

            {dashLoading ? (
              <div className="flex flex-col gap-3">
                <span className="skeleton h-12 w-full" />
                <span className="skeleton h-12 w-full" />
              </div>
            ) : aiFocusOrder.length > 0 ? (
              <div className="flex flex-col gap-3">
                {aiFocusOrder.map((item, idx) => (
                  <div
                    key={item.goalId}
                    className="p-3 rounded-lg bg-white/[0.01] border border-white/5 flex gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <h4 className="text-[11px] font-bold text-[var(--color-text-primary)] leading-tight truncate">
                        {item.goal}
                      </h4>
                      <p className="text-[9px] text-[var(--color-text-muted)] mt-1 leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[var(--color-text-muted)] py-4 text-center">
                No active commitments to prioritize.
              </p>
            )}
          </Card>

          {/* Active Commitments list */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                My Commitments
              </h3>
              <Badge variant="info">{activeGoals.length}</Badge>
            </div>
            
            <div className="flex flex-col gap-3">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 w-full" />
                ))
              ) : (
                activeGoals.map((goal, i) => (
                  <motion.div
                    key={goal._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/goals/${goal._id}`}>
                      <Card padding="p-4" className="group cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] border-white/5 hover:border-indigo-500/20 text-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-sm shrink-0">
                                {CATEGORY_ICONS[goal.category] || '🎯'}
                              </span>
                              <h4 className="font-bold text-[var(--color-text-primary)] truncate">
                                {goal.title}
                              </h4>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-text-muted)] mb-2.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatRelativeDeadline(goal.deadline)}
                              </span>
                              <RiskBadge
                                level={goal.riskScore || 'low'}
                                pulse={goal.riskScore === 'high'}
                              />
                            </div>
                            <ProgressBar
                              value={goal.progress?.completed || 0}
                              max={goal.progress?.total || 1}
                              size="xs"
                              riskAware
                            />
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
