import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard,
  Plus,
  LogOut,
  Menu,
  X,
  Target,
  ClipboardCheck,
  User,
  Shield,
  Settings,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border-subtle)] bg-[var(--color-navy-950)]/80 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-[var(--spacing-page)] h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
              <span className="text-[var(--color-text-primary)]">Deadline</span>
              <span className="text-indigo-400"> Guardian</span>
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive(link.path)
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <Link
              to="/goals/new"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                hover:from-indigo-500 hover:to-indigo-400
                shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Goal
            </Link>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--color-text-primary)] leading-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {user?.email || ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-[var(--color-navy-900)]/95 backdrop-blur-xl border-b border-[var(--color-border-subtle)] p-4"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : 'text-[var(--color-text-secondary)] hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to="/goals/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 transition-all"
              >
                <Plus className="w-5 h-5" />
                New Goal
              </Link>
              <hr className="border-[var(--color-border-subtle)] my-1" />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[var(--color-navy-900)]/95 backdrop-blur-xl border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-around h-16">
          {[
            { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
            { path: '/goals/new', icon: Plus, label: 'New Goal' },
            { path: '/dashboard', icon: ClipboardCheck, label: 'Check-in' },
            { path: '/dashboard', icon: User, label: 'Profile' },
          ].map((tab, i) => {
            const Icon = tab.icon;
            const active = isActive(tab.path) && i === 0;
            return (
              <Link
                key={i}
                to={tab.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  active ? 'text-indigo-400' : 'text-[var(--color-text-muted)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
