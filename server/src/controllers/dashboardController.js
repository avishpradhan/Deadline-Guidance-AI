import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import { calculateGoalForecast, rankGoalsPriority } from '../utils/forecastEngine.js';
import { getCalendarConflictHours } from '../utils/calendarHelper.js';

/**
 * GET /api/dashboard
 * Aggregated endpoint: today's tasks, active goals, risk alerts, AI recommendation, AI Focus Order
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get raw goals
    const goals = await Goal.find({
      userId,
      status: { $in: ['active', 'planning'] },
    }).sort({ deadline: 1 });

    // Attach progress and forecasting intelligence to active goals
    const goalsWithForecasts = await Promise.all(
      goals.map(async (goal) => {
        const tasks = await Task.find({ goalId: goal._id });
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const remaining = total - completed;
        const estimatedHoursRemaining = tasks
          .filter((t) => t.status !== 'completed')
          .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

        const calendarConflictHours = await getCalendarConflictHours(
          userId,
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

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's tasks across all active goals
    const goalIds = goals.map((g) => g._id);
    const todaysTasks = await Task.find({
      goalId: { $in: goalIds },
      status: { $ne: 'completed' },
      dueDate: { $lte: todayEnd },
    })
      .sort({ dueDate: 1 })
      .limit(10);

    // Build risk alerts with full deadline forecast details
    const riskAlerts = goalsWithForecasts
      .filter((g) => g.intelligence.successProbability < 90 || g.riskScore === 'high' || g.riskScore === 'medium')
      .map((g) => {
        const daysBehind = Math.abs(g.intelligence.daysAheadOrBehind);
        const delayStr = g.intelligence.daysAheadOrBehind < 0 ? `${daysBehind} day${daysBehind !== 1 ? 's' : ''}` : '0 days';
        return {
          goalId: g._id,
          goalTitle: g.title,
          riskScore: g.intelligence.successProbability < 50 ? 'high' : 'medium',
          riskReason: `Projected completion is ${new Date(g.intelligence.predictedCompletionDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}.`,
          forecast: {
            predictedCompletionDate: g.intelligence.predictedCompletionDate,
            deadline: g.deadline,
            daysAheadOrBehind: g.intelligence.daysAheadOrBehind,
            successProbability: g.intelligence.successProbability,
            estimatedDelay: delayStr,
          }
        };
      });

    // Rank goals to produce AI Focus Order (Goal Prioritization Advisor)
    const aiFocusOrder = rankGoalsPriority(goalsWithForecasts);

    // Dynamic AI coach recommendation using forecasts
    let aiRecommendation = '';
    if (goalsWithForecasts.length === 0) {
      aiRecommendation = 'Welcome! Create your first commitment or project goal above, and Deadline Guardian will build a personalized AI plan to ensure you deliver it on time.';
    } else {
      const criticallyRisky = goalsWithForecasts.find((g) => g.intelligence.successProbability < 50);
      const atRisk = goalsWithForecasts.find((g) => g.intelligence.successProbability < 90);

      if (criticallyRisky) {
        aiRecommendation = `🚨 Deadline Rescue Alert: Your commitment "${criticallyRisky.title}" has a critical success probability of ${criticallyRisky.intelligence.successProbability}%. A delay of ${Math.abs(criticallyRisky.intelligence.daysAheadOrBehind)} days is projected. Request a "Deadline Rescue" immediately to safeguard this goal.`;
      } else if (atRisk) {
        aiRecommendation = `⚠️ Attention Required: "${atRisk.title}" success probability is currently at ${atRisk.intelligence.successProbability}% (At Risk). AI recommends completing today's tasks early to establish a safety buffer.`;
      } else if (todaysTasks.length > 0) {
        aiRecommendation = `🎯 Priority Focus: You have ${todaysTasks.length} task${todaysTasks.length > 1 ? 's' : ''} to tackle today. Focus on "${todaysTasks[0].title}" first to maintain your progress and protect your deadlines.`;
      } else {
        aiRecommendation = "✨ Deadlines Secured: All systems green. Your success probability scores are healthy. Review upcoming focus areas to stay ahead.";
      }
    }

    res.json({
      todaysTasks,
      activeGoals: goalsWithForecasts,
      riskAlerts,
      aiFocusOrder,
      aiRecommendation,
    });
  } catch (err) {
    next(err);
  }
};
