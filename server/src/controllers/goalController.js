import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import ProgressLog from '../models/ProgressLog.js';
import AIOutput from '../models/AIOutput.js';
import { calculateGoalForecast } from '../utils/forecastEngine.js';
import { getCalendarConflictHours } from '../utils/calendarHelper.js';
import { refreshDecisionInsight } from '../utils/decisionHelper.js';

export const createGoal = async (req, res, next) => {
  try {
    const { title, category, deadline, priority, dailyHours, skillLevel, context, constraints, events } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ error: 'Title and deadline are required.' });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      title,
      category,
      deadline,
      priority,
      dailyHours,
      skillLevel,
      context,
      constraints: constraints || [],
      events: events || [],
      status: 'planning',
    });

    res.status(201).json({ goalId: goal._id, goal });
  } catch (err) {
    next(err);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Attach progress and intelligence forecast data
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const tasks = await Task.find({ goalId: goal._id });
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const remaining = total - completed;
        const estimatedHoursRemaining = tasks
          .filter((t) => t.status !== 'completed')
          .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

        const calendarConflictHours = await getCalendarConflictHours(
          req.user._id,
          goal.createdAt || new Date(),
          goal.deadline,
          goal.dailyHours
        );

        const intelligence = calculateGoalForecast({
          createdAt: goal.createdAt,
          deadline: goal.deadline,
          dailyHours: goal.dailyHours,
          priority: goal.priority,
          totalTasks: total,
          completedTasks: completed,
          remainingTasks: remaining,
          estimatedHoursRemaining,
          calendarConflictHours,
        });

        return {
          ...goal.toObject(),
          progress: { completed, total },
          intelligence,
        };
      })
    );

    res.json({ goals: goalsWithProgress });
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    let goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    // Staleness check: if the last updated timestamp of the insight is on a previous calendar day or insight is missing
    const todayStr = new Date().toDateString();
    const lastUpdateStr = goal.updatedAt ? new Date(goal.updatedAt).toDateString() : '';
    const hasInsight = goal.aiDecisionInsight && goal.aiDecisionInsight.goalForecast;

    if (!hasInsight || lastUpdateStr !== todayStr) {
      console.log(`[getGoalById] Decision insight is stale or missing. Refreshing...`);
      await refreshDecisionInsight(goal._id, req.user._id);
      // Reload updated goal
      const updated = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
      if (updated) {
        goal = updated;
      }
    }

    const tasks = await Task.find({ goalId: goal._id }).sort({ order: 1, dueDate: 1 });
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const total = tasks.length;
    const remaining = total - completed;
    const estimatedHoursRemaining = tasks
      .filter((t) => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const calendarConflictHours = await getCalendarConflictHours(
      req.user._id,
      goal.createdAt || new Date(),
      goal.deadline,
      goal.dailyHours
    );

    const intelligence = calculateGoalForecast({
      createdAt: goal.createdAt,
      deadline: goal.deadline,
      dailyHours: goal.dailyHours,
      priority: goal.priority,
      totalTasks: total,
      completedTasks: completed,
      remainingTasks: remaining,
      estimatedHoursRemaining,
      calendarConflictHours,
    });

    res.json({
      goal: {
        ...goal.toObject(),
        intelligence,
      },
      tasks,
      progress: { completed, total },
      aiCoachNote: 'Complete your daily check-in to get personalized coaching from your AI coach.',
    });
  } catch (err) {
    next(err);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    // Refresh decision insights to reflect updated goal values (timeline, priority, daily capacity, etc.)
    await refreshDecisionInsight(goal._id, req.user._id);
    const updatedGoal = await Goal.findById(goal._id);
    res.json({ goal: updatedGoal || goal });
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    // Clean up associated tasks, progress logs, and AI outputs
    await Promise.all([
      Task.deleteMany({ goalId: goal._id }),
      ProgressLog.deleteMany({ goalId: goal._id }),
      AIOutput.deleteMany({ goalId: goal._id }),
    ]);
    res.json({ message: 'Goal deleted.' });
  } catch (err) {
    next(err);
  }
};

export const completeGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'completed' },
      { new: true }
    );
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const tasks = await Task.find({ goalId: goal._id });
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    // Calculate duration
    const startDate = goal.createdAt;
    const endDate = new Date();
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    res.json({
      status: 'completed',
      summary: {
        totalDays,
        tasksCompleted: completedTasks,
        totalTasks: tasks.length,
      },
    });
  } catch (err) {
    next(err);
  }
};
