import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ShieldAlert, CheckCircle, RefreshCw, AlertCircle, Link2, Link2Off } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

export default function SettingsPage() {
  const { user, initialize } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initialize(); // Refresh user details on load
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/calendar/auth/url');
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('OAuth URL not returned.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to initiate Google Calendar connection.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/calendar/disconnect');
      await initialize(); // Refresh user state
      setMessage('Google Calendar disconnected successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to disconnect calendar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/calendar/sync');
      setMessage(`Successfully synced ${response.data.count} upcoming calendar events.`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to sync Google Calendar.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="max-w-[750px] mx-auto px-4 py-8 text-left"
    >
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
          <Calendar className="w-5.5 h-5.5 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Manage your external integrations and schedule preferences.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-3 mb-6 text-xs"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="font-semibold text-emerald-300">{message}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center gap-3 mb-6 text-xs"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="font-semibold text-red-300">{error}</p>
        </motion.div>
      )}

      {/* Google Calendar Connection Card */}
      <div className="glass-card-static p-6 md:p-8 border-white/5 bg-white/[0.01] shadow-xl rounded-2xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
          Google Calendar Integration
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          Synchronize meetings, exams, interviews, and travel plans automatically. 
          The AI engine cross-references calendar event durations against your daily capacity to highlight timeline risks.
        </p>

        {user?.googleCalendarConnected ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white">
                  Integration Active
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-normal">
                  Google Calendar token validated. Next 30 days of conflicts are dynamically calculated.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <button
                onClick={handleSync}
                disabled={syncing || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                  hover:from-indigo-500 hover:to-indigo-400 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4.5 h-4.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Calendar Now'}
              </button>

              <button
                onClick={handleDisconnect}
                disabled={loading || syncing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/15 transition-all cursor-pointer disabled:opacity-50"
              >
                <Link2Off className="w-4.5 h-4.5" />
                Disconnect Calendar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-amber-400">
                  Not Connected
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-normal">
                  Schedules are currently analyzed using static user-defined parameters only.
                </p>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold
                bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Link2 className="w-4.5 h-4.5" />
              {loading ? 'Initiating OAuth...' : 'Connect Google Calendar'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-[10px] text-[var(--color-text-muted)] max-w-lg mx-auto leading-relaxed">
        Deadline Guardian AI strictly complies with Google OAuth security policies. 
        Your credentials and calendar events are stored stateless and encrypted, and are never shared with external trackers.
      </div>
    </motion.div>
  );
}
