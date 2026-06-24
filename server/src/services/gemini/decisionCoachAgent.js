import { generateJSON } from './client.js';

const SYSTEM_INSTRUCTION = `You are a world-class AI Decision Coach and strategic productivity companion.
Your role is to analyze a user's goal, tasks (with chronological order dependencies), calendar event conflicts, forecast metrics, previous states, and check-in history to generate high-impact decision recommendations and transparent, data-backed reasoning.

Core Decision Support Guidelines:
1. Actionable & Specific: Never output generic coaching platitudes ("stay consistent", "work harder", "focus on priorities", "keep up momentum", "front-load your work") unless backed by quantitative velocity data. Tell the user exactly what happens if they do or don't take action.
2. Chronological Dependencies: Evaluate task dependencies based on task order. Lower-order tasks or tasks in earlier phases act as prerequisites. If a prerequisite task is delayed or pending, analyze the bottleneck impact on subsequent phases.
3. Calendar Conflict Awareness: Detail exactly how travel, meetings, and exams restrict capacity.
4. Change Analysis: Compare the current forecast metrics with the previous analysis parameters to identify what changed and list the specific changeDrivers (factor and impact delta).
5. Goal-Type Intelligence:
   - Exams/Certifications: Focus on syllabus coverage, weak topics, mock tests, and review windows.
   - Job Search/Placements: Evaluate application pipeline size, resume reviews, and interview readiness.
   - Projects/Software: Look at milestone completion, implementation blocks, testing buffers.
   - Fitness/Health: Assess consistency trends, recovery gaps, and habit balance.
   - Content Creation: Review publishing schedules, production backlog, bottlenecks.
6. JSON Schema: Always return valid JSON matching the exact schema specified in the prompt.`;

export const generateDecisionInsight = async ({
  goal,
  tasks,
  calendarEvents = [],
  forecast,
  previousInsight = null,
  checkinLogs = [],
}) => {
  // 1. Format tasks and highlight dependencies
  const tasksList = tasks
    .map(
      (t) =>
        `- [${t.status.toUpperCase()}] ${t.title} (Order: ${t.order}, Est: ${t.estimatedHours}h, Phase: ${t.phase || 'General'}, Due: ${
          t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'N/A'
        })`
    )
    .join('\n');

  // 2. Format calendar events
  const calendarEventsList = calendarEvents.length > 0
    ? calendarEvents
        .map((c) => {
          const startStr = new Date(c.start).toISOString().split('T')[0];
          let endStr = new Date(c.end).toISOString().split('T')[0];
          if (c.duration === 'all-day') {
            const endInclusive = new Date(c.end);
            endInclusive.setDate(endInclusive.getDate() - 1);
            endStr = endInclusive.toISOString().split('T')[0];
          }
          return startStr === endStr
            ? `- ${c.title} (${c.type}) on ${startStr} (Duration: ${c.duration || 'N/A'})`
            : `- ${c.title} (${c.type}) from ${startStr} to ${endStr} (Duration: ${c.duration || 'N/A'})`;
        })
        .join('\n')
    : 'None';

  // 3. Format history and check-ins
  const completedCheckins = checkinLogs.length;
  const recentBlockers = checkinLogs
    .filter((log) => log.blockerNote)
    .map((log) => `- [${new Date(log.date).toISOString().split('T')[0]}]: ${log.blockerNote}`)
    .join('\n');

  // 4. Format previous metrics
  const prevProb = previousInsight?.highestImpactAction?.beforeProbability || previousInsight?.scenarios?.[0]?.successProbability || 70;
  const prevHealth = previousInsight?.insightDelta?.healthScoreChange ? (forecast.healthScore - previousInsight.insightDelta.healthScoreChange) : 75;
  const prevDate = previousInsight?.goalForecast ? 'Previously calculated' : 'N/A';

  const prompt = `Analyze this commitment goal and generate strategic decision intelligence.

Goal Details:
- Title: ${goal.title}
- Category: ${goal.category} (Adapt your terminology to this goal type)
- Deadline: ${new Date(goal.deadline).toISOString().split('T')[0]}
- Daily Available Hours: ${goal.dailyHours} hours/day
- Skill Level: ${goal.skillLevel}
- Extra Context: ${goal.context || 'None'}

Current Mathematical Forecast:
- Success Probability: ${forecast.successProbability}%
- Health Score: ${forecast.healthScore}/100
- Projected Completion: ${new Date(forecast.predictedCompletionDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
- Pacing Status: ${forecast.daysAheadOrBehind < 0 ? `${Math.abs(forecast.daysAheadOrBehind)} days behind` : `${forecast.daysAheadOrBehind} days ahead`}
- Remaining Effort: ${forecast.estimatedHoursRemaining} hours

Previous Forecast Parameters:
- Previous Success Probability: ${prevProb}%
- Previous Health Score: ${prevHealth}/100
- Previous Projected Completion: ${prevDate}

Calendar Event Conflicts (Google Calendar):
${calendarEventsList}

Tasks List (Chronological Order):
${tasksList}

Check-in & Blocker History:
- Completed check-in entries: ${completedCheckins}
- Logged blockers:
${recentBlockers || 'None'}

Please return a JSON response matching the following schema. Ensure all fields are filled:
{
  "goalForecast": "A direct, 1-sentence forecast stating projected completion date relative to the deadline (e.g., 'You are projected to miss the deadline by 4 days based on current completion velocity.')",
  
  "insightDelta": {
    "probabilityChange": 12, // Integer indicating shift (e.g., 12 for +12%, -8 for -8%)
    "healthScoreChange": 5,  // Integer indicating shift
    "forecastDateChange": -2, // Change in projected completion days (negative values mean completion is earlier, positive mean later)
    "explanation": "Brief 1-sentence explanation of what caused the metrics to change (e.g., 'Completed all Phase 1 tasks ahead of schedule.')"
  },

  "changeDrivers": [
    {
      "factor": "Reason for shift (e.g., 'Completed 5 tasks')",
      "impact": 8 // Integer percentage impact (e.g., 8 for +8%, -5 for -5%)
    }
  ],

  "riskDrivers": [
    {
      "type": "positive", // 'positive' or 'negative'
      "factor": "Specific factor (e.g., '32 available work hours remain', '16 hours lost to calendar conflicts', '0 tasks completed in last 3 days')"
    }
  ],

  "highestImpactAction": {
    "action": "Specify the single task action that creates the largest probability improvement (e.g. 'Complete Phase 1 within the next 48 hours.')",
    "beforeProbability": ${forecast.successProbability},
    "afterProbability": 89 // Simulated success probability if action is taken (must be higher than before)
  },

  "scenarios": [
    {
      "name": "Current Path",
      "successProbability": ${forecast.successProbability}
    },
    {
      "name": "Complete Today's Tasks",
      "successProbability": 88 // Simulated success probability
    },
    {
      "name": "Complete Phase Early",
      "successProbability": 93 // Simulated success probability
    },
    {
      "name": "Skip Today",
      "successProbability": 61 // Simulated success probability (must be lower than before)
    }
  ],

  "bottlenecks": [
    {
      "task": "Specific pre-requisite task causing a delay (e.g. 'Complete Resume')",
      "blockedTasks": 4, // Number of downstream tasks blocked by this task
      "impact": "Description of why this blocks progress (e.g. 'Interview Preparation cannot begin.')"
    }
  ],

  "reasoning": "Data-backed explanation of the logic behind the forecast and calculations (e.g. 'This goal requires 18 remaining hours. Your calendar currently provides 32 available hours. However, two scheduled conflicts reduce effective capacity by 16 hours. The largest risk is delayed completion of foundational tasks, which blocks later review activities.')",
  
  "confidenceScore": 85, // Integer 0-100 representing how confident you are in the forecast
  "confidenceReasons": [
    "List specific indicators (e.g., 'insufficient completion history', 'stable work pattern', 'limited velocity data', 'high-quality calendar data')"
  ]
}

Note:
1. Make sure success probabilities are mathematically consistent (e.g. Skip Today is lower than Current Path, which is lower than Complete Today's Tasks).
2. The delta changes (insightDelta.probabilityChange) must match the difference between current forecast and previous forecast.
3. Identify real dependency bottlenecks using task ordering. Lower-order tasks or earlier phases must be identified as blocking subsequent tasks.`;

  return generateJSON(prompt, SYSTEM_INSTRUCTION);
};
