import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Activity,
  AlertCircle,
  Clock,
  HelpCircle
} from 'lucide-react';

export default function AIDecisionInsightCard({ insight, isLoading = false }) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="glass-card-static p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-6 w-12 bg-white/10 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-12 w-full bg-white/10 rounded" />
          <div className="h-4 w-4/5 bg-white/10 rounded" />
        </div>
        <div className="h-24 w-full bg-white/10 rounded" />
      </div>
    );
  }

  if (!insight || !insight.goalForecast) {
    return (
      <div className="glass-card-static p-6 text-center space-y-4">
        <Activity className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Decision Intelligence System
        </h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          AI is compiling decision insights. Sync your calendar or perform a daily check-in to run diagnostic calculations.
        </p>
      </div>
    );
  }

  const {
    goalForecast,
    insightDelta,
    changeDrivers = [],
    riskDrivers = [],
    highestImpactAction,
    scenarios = [],
    bottlenecks = [],
    reasoning,
    confidenceScore = 0,
    confidenceReasons = []
  } = insight;

  // Determine delta details
  const probChange = insightDelta?.probabilityChange || 0;
  const healthChange = insightDelta?.healthScoreChange || 0;
  const isPositive = probChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-static overflow-hidden border border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-primary)] to-[var(--color-navy-950)]/90"
    >
      {/* Glow Effect Top border */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

      <div className="p-6 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Decision Intelligence
          </h3>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
            AI Engine v2.0
          </span>
        </div>

        {/* 1. Forecast Header / Success Probability */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Completion Forecast
            </span>
            {probChange !== 0 && (
              <div
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isPositive
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="w-3 h-3 shrink-0" />
                ) : (
                  <ArrowDown className="w-3 h-3 shrink-0" />
                )}
                {isPositive ? '+' : ''}
                {probChange}% success probability vs. last update
              </div>
            )}
          </div>

          <p className="text-sm text-[var(--color-text-primary)] font-medium leading-relaxed">
            {goalForecast}
          </p>

          {insightDelta?.explanation && (
            <p className="text-xs text-[var(--color-text-muted)] italic">
              "{insightDelta.explanation}"
            </p>
          )}
        </div>

        {/* 2. What Changed Since Yesterday */}
        {changeDrivers && changeDrivers.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              What Changed Since Last Update
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {changeDrivers.map((driver, idx) => {
                const isDriverPos = (driver.impact || 0) >= 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {isDriverPos ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-[var(--color-text-primary)] font-medium">
                        {driver.factor}
                      </span>
                    </div>
                    <span
                      className={`font-semibold shrink-0 ${
                        isDriverPos ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isDriverPos ? '+' : ''}
                      {driver.impact}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Risk Drivers */}
        {riskDrivers && riskDrivers.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Active Risk Drivers
            </h4>
            <div className="space-y-2">
              {riskDrivers.map((driver, idx) => {
                const isNeg = driver.type === 'negative';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-xs p-2 rounded-lg border ${
                      isNeg
                        ? 'bg-red-500/[0.02] border-red-500/10 text-[var(--color-text-primary)]'
                        : 'bg-emerald-500/[0.02] border-emerald-500/10 text-[var(--color-text-primary)]'
                    }`}
                  >
                    {isNeg ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <span>{driver.factor}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Highest Impact Action (Action Banner) */}
        {highestImpactAction && highestImpactAction.action && (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.08]">
              <Zap className="w-24 h-24 text-indigo-400" />
            </div>
            
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Highest Impact Decision
              </span>
            </div>

            <h5 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
              {highestImpactAction.action}
            </h5>

            <div className="flex items-center gap-3 pt-1 text-xs">
              <span className="text-[var(--color-text-secondary)]">Probability Shift:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-red-400">{highestImpactAction.beforeProbability}%</span>
                <span className="text-[var(--color-text-muted)]">➔</span>
                <span className="text-emerald-400">{highestImpactAction.afterProbability}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Scenario Simulator */}
        {scenarios && scenarios.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Decision Scenario Simulator
            </h4>
            <div className="space-y-3">
              {scenarios.map((scenario, idx) => {
                const value = scenario.successProbability || 0;
                let colorClass = 'bg-red-500';
                let textClass = 'text-red-400';
                if (value >= 80) {
                  colorClass = 'bg-emerald-500';
                  textClass = 'text-emerald-400';
                } else if (value >= 50) {
                  colorClass = 'bg-indigo-500';
                  textClass = 'text-indigo-400';
                }
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[var(--color-text-primary)]">{scenario.name}</span>
                      <span className={`font-semibold ${textClass}`}>{value}% probability</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${colorClass}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Dependency Bottlenecks */}
        {bottlenecks && bottlenecks.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Critical Bottleneck Warnings
            </h4>
            <div className="space-y-2">
              {bottlenecks.map((bottleneck, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-500/[0.02] border border-amber-500/10 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{bottleneck.task}</span>
                    </div>
                    {bottleneck.blockedTasks > 0 && (
                      <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded text-amber-300 font-medium">
                        Blocks {bottleneck.blockedTasks} downstream tasks
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {bottleneck.impact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. AI Reasoning (Expandable Accordion) */}
        {reasoning && (
          <div className="border-t border-white/5 pt-4">
            <button
              onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
              className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <span>AI Analytical Reasoning</span>
              {isReasoningExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isReasoningExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pt-3 text-justify whitespace-pre-line">
                    {reasoning}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 8. Forecast Confidence */}
        <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Confidence Index:</span>
            <span className="font-semibold text-[var(--color-text-primary)]">
              {confidenceScore}%
            </span>
          </div>

          {confidenceReasons && confidenceReasons.length > 0 && (
            <div className="relative group">
              <span className="text-[10px] text-indigo-400 font-semibold cursor-help underline decoration-indigo-400/30 hover:text-indigo-300">
                Diagnostic Factors
              </span>
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[var(--color-surface-overlay)] border border-[var(--color-border-subtle)] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-[10px] text-[var(--color-text-secondary)] space-y-1">
                <p className="font-bold text-[var(--color-text-primary)] mb-1">
                  Confidence Drivers:
                </p>
                {confidenceReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-indigo-400 shrink-0">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
