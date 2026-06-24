import { generateJSON } from './client.js';

const SYSTEM_INSTRUCTION = `You are a risk prediction engine for productivity goals.
You assess whether a user is on track to meet their deadline based on their current pace.
Be analytical and precise. Return a clear risk classification with reasoning.
Always return valid JSON.`;

/**
 * Agent 4: Risk Prediction Agent
 * Classifies risk based on completion rate and pace.
 */
export const predictRisk = async ({
  goalTitle,
  completedTasks,
  totalTasks,
  daysRemaining,
  daysElapsed,
}) => {
  const currentPace = daysElapsed > 0 ? (completedTasks / daysElapsed).toFixed(2) : 0;
  const requiredPace = daysRemaining > 0 ? ((totalTasks - completedTasks) / daysRemaining).toFixed(2) : 999;

  const prompt = `Assess risk for this goal. Return JSON:
{
  "riskScore": "low" | "medium" | "high",
  "reason": "1 sentence explaining the risk classification"
}

Data:
- Goal: ${goalTitle}
- Tasks completed: ${completedTasks} of ${totalTasks}
- Days elapsed: ${daysElapsed}
- Days remaining: ${daysRemaining}
- Current pace: ${currentPace} tasks/day
- Required pace: ${requiredPace} tasks/day

Classification guide:
- Low: Current pace >= required pace, buffer exists
- Medium: Current pace is slightly below required, achievable with effort
- High: Current pace is significantly below required, deadline at risk`;

  return generateJSON(prompt, SYSTEM_INSTRUCTION);
};
