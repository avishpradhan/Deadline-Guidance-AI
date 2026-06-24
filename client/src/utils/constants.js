/**
 * Application-wide constants
 */

export const GOAL_CATEGORIES = [
  { value: 'work_deadline', label: 'Work Deadline' },
  { value: 'business_startup', label: 'Business / Startup' },
  { value: 'project', label: 'Project / Milestone' },
  { value: 'job_interview', label: 'Job Interview' },
  { value: 'exam_prep', label: 'Exam Prep' },
  { value: 'skill_learning', label: 'Skill Learning' },
  { value: 'event_planning', label: 'Event Planning' },
  { value: 'personal_commitment', label: 'Personal Commitment' },
  { value: 'other', label: 'Other' },
];

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400' },
  { value: 'high', label: 'High', color: 'text-red-400' },
  { value: 'critical', label: 'Critical', color: 'text-red-500' },
];

export const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const RISK_LEVELS = {
  low: { label: 'Low Risk', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  medium: { label: 'Medium Risk', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  high: { label: 'High Risk', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export const TASK_STATUS = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  skipped: 'skipped',
};

export const GOAL_STATUS = {
  planning: 'planning',
  analyzing: 'analyzing',
  active: 'active',
  completed: 'completed',
  archived: 'archived',
};

export const CATEGORY_ICONS = {
  work_deadline: '🏢',
  business_startup: '🚀',
  project: '💻',
  job_interview: '🤝',
  exam_prep: '📚',
  skill_learning: '🧠',
  event_planning: '🎉',
  personal_commitment: '🏡',
  other: '🎯',
};
