/**
 * Date utility functions for Deadline Guardian AI
 */

/**
 * Get a time-aware greeting
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Calculate days remaining until a deadline
 */
export const daysRemaining = (deadline) => {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Format a date string for display
 */
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a date as relative (e.g., "3 days left", "Due today", "2 days overdue")
 */
export const formatRelativeDeadline = (deadline) => {
  const days = daysRemaining(deadline);
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
};

/**
 * Check if a date is today
 */
export const isToday = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (dateStr) => {
  return new Date(dateStr) < new Date() && !isToday(dateStr);
};

/**
 * Format today's date for display
 */
export const formatToday = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};
