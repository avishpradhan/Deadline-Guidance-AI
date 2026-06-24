/**
 * AI Deadline Intelligence - Forecasting and Decision Support Engine
 */

/**
 * Calculates deadline completion forecast, success probability, and health score.
 */
export const calculateGoalForecast = ({
  createdAt,
  deadline,
  dailyHours,
  priority,
  totalTasks,
  completedTasks,
  remainingTasks,
  estimatedHoursRemaining,
  calendarConflictHours = 0,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goalDeadline = new Date(deadline);
  goalDeadline.setHours(23, 59, 59, 999);

  // 1. Days calculations
  const daysRemaining = Math.max(1, Math.ceil((goalDeadline - today) / (1000 * 60 * 60 * 24)));
  const createdDate = new Date(createdAt || today);
  const daysElapsed = Math.max(1, Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24)));

  // 2. Velocity calculations (hours completed vs elapsed time)
  // Default total hours estimation if not provided
  const defaultTaskHours = 2; // Average task hours
  const totalTasksCount = totalTasks || 1;
  const completedTasksCount = completedTasks || 0;
  const remainingTasksCount = remainingTasks || 0;

  const resolvedEstimatedHoursRemaining = typeof estimatedHoursRemaining === 'number' 
    ? estimatedHoursRemaining 
    : remainingTasksCount * defaultTaskHours;

  const estimatedHoursCompleted = completedTasksCount * defaultTaskHours;
  const totalEstimatedHours = estimatedHoursCompleted + resolvedEstimatedHoursRemaining;

  // Calculate historical hours completed per day
  const hoursCompletedPace = estimatedHoursCompleted / daysElapsed;

  // Effective daily velocity: if historical pace exists, blend it with daily capacity.
  // Otherwise, use daily capacity.
  const capacity = dailyHours || 3;
  let effectiveVelocity = capacity;
  if (completedTasksCount > 0) {
    // Blend: 70% historical pace, 30% self-reported daily capacity
    effectiveVelocity = (hoursCompletedPace * 0.7) + (capacity * 0.3);
  }
  // Clamp effective velocity to a realistic range (minimum 0.5 hours/day)
  effectiveVelocity = Math.max(0.5, Math.min(16, effectiveVelocity));

  // 3. Expected days needed
  const expectedDaysNeeded = Math.ceil(resolvedEstimatedHoursRemaining / effectiveVelocity);

  // 4. Predicted completion date
  const predictedCompletionDate = new Date();
  predictedCompletionDate.setDate(predictedCompletionDate.getDate() + expectedDaysNeeded);
  const predictedDateStr = predictedCompletionDate.toISOString().split('T')[0];

  // 5. Days ahead or behind (subtracting days lost to calendar conflicts)
  const conflictDays = calendarConflictHours / capacity;
  const daysAheadOrBehind = parseFloat((daysRemaining - expectedDaysNeeded - conflictDays).toFixed(1));

  // 6. Forecast Status
  let forecastStatus = 'on_track';
  if (daysAheadOrBehind < 0) {
    forecastStatus = 'behind_schedule';
  } else if (daysAheadOrBehind > 3) {
    forecastStatus = 'ahead_of_schedule';
  }

  // 7. Confidence Score (0-100)
  // Higher confidence with more tasks completed and longer history
  const progressPercent = completedTasksCount / (totalTasksCount || 1);
  let confidence = Math.round(40 + (progressPercent * 40) + Math.min(20, daysElapsed * 1.5));
  confidence = Math.max(30, Math.min(98, confidence));

  // 8. Success Probability Score (0-100)
  let successProbability = 50;
  if (daysAheadOrBehind >= 0) {
    // Ahead/on track: 75% baseline, scales up with buffer
    successProbability = Math.round(75 + (daysAheadOrBehind * 5));
  } else {
    // Behind: drops fast with each day behind
    successProbability = Math.round(70 + (daysAheadOrBehind * 10));
  }
  successProbability = Math.max(5, Math.min(99, successProbability));

  // 9. Deadline Health Score (0-100)
  // Incorporates: progress %, success probability, remaining workload ratio
  const progressWeight = progressPercent * 25; // max 25 points
  const probabilityWeight = successProbability * 0.5; // max 50 points
  
  // Workload ratio vs remaining days (adjusting total capacity hours for conflicts)
  const totalCapacityHours = Math.max(1, (daysRemaining * capacity) - calendarConflictHours);
  const workLoadRatio = resolvedEstimatedHoursRemaining / totalCapacityHours;
  let workloadWeight = 25;
  if (workLoadRatio > 1.2) {
    workloadWeight = Math.max(0, 25 - (workLoadRatio - 1.2) * 20);
  }
  
  const healthScore = Math.round(progressWeight + probabilityWeight + workloadWeight);
  const healthScoreBounded = Math.max(0, Math.min(100, healthScore));

  return {
    predictedCompletionDate: predictedDateStr,
    daysAheadOrBehind,
    forecastStatus,
    confidence,
    successProbability,
    healthScore: healthScoreBounded,
    daysRemaining,
    estimatedHoursRemaining: resolvedEstimatedHoursRemaining,
  };
};

/**
 * Prioritizes active goals based on risk, deadlines, capacity, and impact.
 */
export const rankGoalsPriority = (goalsWithForecasts) => {
  const ranked = goalsWithForecasts.map((g) => {
    const daysRemaining = g.intelligence?.daysRemaining || 30;
    const probability = g.intelligence?.successProbability || 100;
    const health = g.intelligence?.healthScore || 100;
    const remainingHours = g.intelligence?.estimatedHoursRemaining || 0;

    // Priority multipliers
    const priorityWeight = {
      critical: 50,
      high: 35,
      medium: 20,
      low: 5,
    }[g.priority || 'medium'];

    // Urgency score: closer deadline = higher urgency
    const urgencyScore = Math.max(0, 100 - (daysRemaining * 3));

    // Risk score: lower probability / health = higher focus priority
    const riskScore = (100 - probability) * 0.8 + (100 - health) * 0.4;

    // Remaining effort score: more hours = slightly higher focus need to clear workload
    const effortScore = Math.min(15, remainingHours * 0.2);

    const totalPriorityScore = urgencyScore + riskScore + priorityWeight + effortScore;

    // Determine advisor explanation
    let reason = 'Healthy status, maintain current pacing.';
    if (g.status === 'planning') {
      reason = 'Goal is in planning phase. Generate AI plan to initiate execution.';
    } else if (probability < 50) {
      reason = `Critical delay risk. Requires immediate focus to resolve ${remainingHours}h of pending tasks.`;
    } else if (daysRemaining <= 3) {
      reason = `Imminent deadline in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Complete final milestones now.`;
    } else if (g.priority === 'critical') {
      reason = 'High-impact commitment. Prioritize daily steps to keep pacing secure.';
    } else if (probability < 80) {
      reason = 'Moderate risk of delay. Address pending tasks early to build buffer.';
    } else if (daysRemaining <= 7) {
      reason = `Approaching deadline (${daysRemaining} days left). Maintain focused execution.`;
    }

    return {
      goalId: g._id,
      title: g.title,
      category: g.category,
      priorityScore: totalPriorityScore,
      reason,
    };
  });

  // Sort descending by priorityScore
  return ranked
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item, index) => ({
      goalId: item.goalId,
      goal: item.title,
      category: item.category,
      priority: index + 1,
      reason: item.reason,
    }));
};
