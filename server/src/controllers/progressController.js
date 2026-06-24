import Task from '../models/Task.js';
import ProgressLog from '../models/ProgressLog.js';
import { refreshDecisionInsight } from '../utils/decisionHelper.js';

export const checkin = async (req, res, next) => {
  try {
    const { goalId, date, completedTasks, blockerNote } = req.body;

    if (!goalId || !completedTasks) {
      return res.status(400).json({ error: 'goalId and completedTasks are required.' });
    }

    // Update task statuses
    if (completedTasks.length > 0) {
      await Task.updateMany(
        { _id: { $in: completedTasks }, goalId },
        { status: 'completed', completedAt: new Date() }
      );
    }

    // Create progress log
    const log = await ProgressLog.create({
      goalId,
      userId: req.user._id,
      date: date || new Date(),
      completedTaskIds: completedTasks,
      blockerNote: blockerNote || '',
    });

    // Recalculate AI insights based on the new progress check-in
    await refreshDecisionInsight(goalId, req.user._id);

    res.json({
      status: 'logged',
      log,
    });
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const logs = await ProgressLog.find({ goalId: req.params.goalId })
      .sort({ date: -1 })
      .limit(30);

    res.json({ history: logs });
  } catch (err) {
    next(err);
  }
};
