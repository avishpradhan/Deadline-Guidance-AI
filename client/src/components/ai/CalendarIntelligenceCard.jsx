import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, RefreshCw, AlertTriangle, ArrowRight, Clock, HelpCircle, ChevronRight } from 'lucide-react';
import api from '../../services/api';

export default function CalendarIntelligenceCard({ goalId, onForecastChange }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchIntelligence = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get(`/calendar/intelligence?goalId=${goalId}`);
      setData(response.data);
      // Notify parent component if forecast details changed
      if (onForecastChange && response.data.impactAnalysis) {
        onForecastChange(response.data.impactAnalysis);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Could not fetch calendar conflicts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      // Execute calendar sync
      await api.post('/calendar/sync');
      // Re-fetch intelligence
      await fetchIntelligence(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Calendar sync failed. Is your Google Calendar connected?');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [goalId]);

  if (loading) {
    return (
      <div className="glass-card-static p-6 animate-pulse">
        <div className="h-6 w-48 bg-[var(--color-navy-700)] rounded-md mb-4"></div>
        <div className="h-4 w-full bg-[var(--color-navy-700)] rounded-md mb-2"></div>
        <div className="h-4 w-2/3 bg-[var(--color-navy-700)] rounded-md"></div>
      </div>
    );
  }

  // If user hasn't connected their calendar, show a connect prompt
  const isNotConnected = error && (error.toLowerCase().includes('connect') || error.toLowerCase().includes('credentials'));

  if (isNotConnected) {
    return (
      <div className="glass-card-static p-6 border-dashed border-[var(--color-border-subtle)] hover:border-indigo-500/40 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25 text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Unlock Google Calendar Intelligence
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
              Connect your Google Calendar to automatically parse exam schedules, meetings, and trips. 
              The system will dynamically recalculate your success probability based on timeline capacity overlaps.
            </p>
            <a
              href="/settings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-4 group"
            >
              Connect Calendar in Settings
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-static p-6 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 text-red-400 mb-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="text-sm font-bold">Calendar Intelligence Error</h3>
        </div>
        <p className="text-xs text-red-300 mb-4">{error}</p>
        <button
          onClick={() => fetchIntelligence()}
          className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const { events, totalConflictHours, impactAnalysis } = data || { events: [], totalConflictHours: 0, impactAnalysis: {} };
  const hasConflicts = totalConflictHours > 0;

  return (
    <div className="glass-card-static p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Calendar Intelligence
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Real-world capacity conflict tracking
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/15 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Impact Analysis Area */}
      <div className={`p-4 rounded-xl border ${hasConflicts ? 'border-amber-500/20 bg-amber-500/5' : 'border-indigo-500/10 bg-indigo-500/5'}`}>
        <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-2">
          {hasConflicts ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Schedule Conflicts Detected
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              Deadlines Secure
            </>
          )}
        </h4>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {impactAnalysis.capacityReducedText}
        </p>

        {hasConflicts && (
          <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
              Success Probability Impact
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-[var(--color-text-secondary)]">
                {impactAnalysis.beforeProbability}%
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-red-400">
                {impactAnalysis.afterProbability}%
              </span>
              <span className="text-xs font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded ml-1">
                {impactAnalysis.delta}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Event Conflicts List */}
      <div>
        <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-3">
          Timeline Events ({events.length})
        </h4>

        {events.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-[var(--color-border-subtle)] rounded-xl">
            <p className="text-xs text-[var(--color-text-muted)]">
              No calendar events detected in goal timeframe.
            </p>
          </div>
        ) : (
          <div className="max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-2">
            {events.map((event, idx) => {
              const eventDate = new Date(event.start).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              // Tag styles
              const tagColors = {
                travel: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
                exam: 'bg-red-500/10 text-red-400 border-red-500/15',
                interview: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
                meeting: 'bg-purple-500/10 text-purple-400 border-purple-500/15',
                family_event: 'bg-pink-500/10 text-pink-400 border-pink-500/15',
                work_deadline: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
                hackathon: 'bg-teal-500/10 text-teal-400 border-teal-500/15',
                other: 'bg-slate-500/10 text-slate-400 border-slate-500/15',
              }[event.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/15';

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-[var(--color-border-subtle)] text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] mt-1">
                      <span className="font-medium text-indigo-400">{eventDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {event.duration}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize shrink-0 ${tagColors}`}>
                    {event.type.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
