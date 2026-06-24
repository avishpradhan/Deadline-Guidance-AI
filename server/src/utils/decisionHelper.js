import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import ProgressLog from '../models/ProgressLog.js';
import CalendarEvent from '../models/CalendarEvent.js';
import { calculateGoalForecast } from './forecastEngine.js';
import { getCalendarConflictHours } from './calendarHelper.js';
import { generateDecisionInsight } from '../services/gemini/decisionCoachAgent.js';

/**
 * Re-runs forecast equations and invokes the Decision Coach Agent to compile 
 * structured decision insights. Saves the result to the Goal model.
 */
export const refreshDecisionInsight = async (goalId, userId) => {
  try {
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      console.warn(`[refreshDecisionInsight] Goal ${goalId} not found for user ${userId}`);
      return null;
    }

    const tasks = await Task.find({ goalId }).sort({ order: 1, dueDate: 1 });
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const remaining = total - completed;
    const estimatedHoursRemaining = tasks
      .filter((t) => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const startDate = goal.createdAt || new Date();
    const endDate = goal.deadline;

    const calendarEvents = await CalendarEvent.find({
      userId,
      start: { $lte: endDate },
      end: { $gte: startDate },
    }).sort({ start: 1 });

    const calendarConflictHours = await getCalendarConflictHours(
      userId,
      startDate,
      endDate,
      goal.dailyHours
    );

    const forecast = calculateGoalForecast({
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

    const checkinLogs = await ProgressLog.find({ goalId }).sort({ date: -1 });

    // Store previous decision insight before recalculation for delta comparison
    const previousInsight = goal.aiDecisionInsight || null;

    // Generate new decision insight using the Decision Coach Gemini Agent
    let insight = null;
    try {
      insight = await generateDecisionInsight({
        goal,
        tasks,
        calendarEvents,
        forecast,
        previousInsight,
        checkinLogs,
      });
    } catch (geminiErr) {
      console.error('Gemini Decision Coach Agent call failed, applying fallback calculations:', geminiErr);
      
      // Fallback calculation object if Gemini API fails
      insight = {
        goalForecast: forecast.daysAheadOrBehind < 0 
          ? `You are projected to miss the deadline by ${Math.abs(forecast.daysAheadOrBehind)} days based on current pacing.`
          : 'You are projected to complete this goal on schedule.',
        insightDelta: {
          probabilityChange: previousInsight ? (forecast.successProbability - (previousInsight.highestImpactAction?.beforeProbability || 70)) : 0,
          healthScoreChange: 0,
          forecastDateChange: 0,
          explanation: 'Calculated using local backup metrics. Dynamic AI was temporarily offline.'
        },
        changeDrivers: [],
        riskDrivers: [
          { 
            type: forecast.daysAheadOrBehind < 0 ? 'negative' : 'positive', 
            factor: forecast.daysAheadOrBehind < 0 ? 'Completion velocity is behind required pacing' : 'Pacing status is secure' 
          }
        ],
        highestImpactAction: {
          action: 'Complete pending tasks in the current phase.',
          beforeProbability: forecast.successProbability,
          afterProbability: Math.min(forecast.successProbability + 5, 95)
        },
        scenarios: [
          { name: 'Current Path', successProbability: forecast.successProbability }
        ],
        bottlenecks: [],
        reasoning: `Goal requires ${estimatedHoursRemaining}h remaining effort. Available timeline capacity is ${(forecast.daysRemaining * goal.dailyHours - calendarConflictHours)}h.`,
        confidenceScore: forecast.confidence,
        confidenceReasons: ['active local calculations', 'fallback connection logs']
      };
    }

    if (insight) {
      goal.aiDecisionInsight = {
        summary: insight.goalForecast || '',
        recommendation: insight.highestImpactAction?.action || '',
        confidence: typeof insight.confidenceScore === 'number' ? insight.confidenceScore : forecast.confidence,
        
        goalForecast: insight.goalForecast || '',
        insightDelta: {
          probabilityChange: insight.insightDelta?.probabilityChange || 0,
          healthScoreChange: insight.insightDelta?.healthScoreChange || 0,
          forecastDateChange: insight.insightDelta?.forecastDateChange || 0,
          explanation: insight.insightDelta?.explanation || '',
        },
        changeDrivers: insight.changeDrivers || [],
        riskDrivers: insight.riskDrivers || [],
        highestImpactAction: {
          action: insight.highestImpactAction?.action || '',
          beforeProbability: insight.highestImpactAction?.beforeProbability || forecast.successProbability,
          afterProbability: insight.highestImpactAction?.afterProbability || forecast.successProbability,
        },
        scenarios: insight.scenarios || [],
        bottlenecks: insight.bottlenecks || [],
        reasoning: insight.reasoning || '',
        confidenceScore: typeof insight.confidenceScore === 'number' ? insight.confidenceScore : forecast.confidence,
        confidenceReasons: insight.confidenceReasons || [],
      };
      
      // Update Goal's riskScore based on calculated success probability
      if (forecast.successProbability < 50) {
        goal.riskScore = 'high';
      } else if (forecast.successProbability < 80) {
        goal.riskScore = 'medium';
      } else {
        goal.riskScore = 'low';
      }

      await goal.save();
      console.log(`[refreshDecisionInsight] Recalculated and saved insights for goal ${goalId}`);
    }

    return goal.aiDecisionInsight;
  } catch (err) {
    console.error('[refreshDecisionInsight] Severe error in refresher:', err);
    return null;
  }
};
