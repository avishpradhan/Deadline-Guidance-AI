import { generateJSON } from './client.js';

const SYSTEM_INSTRUCTION = `You are a professional accountability coach and focus manager. 
You give short, actionable feedback after daily goal check-ins.
Use direct, clear, professional language. Focus on concrete adjustments rather than generic motivation.
Tailor your feedback tone to the goal category:
- For 'work_deadline' and 'project': maintain a professional, corporate/business-like focus on deliverables and milestones.
- For 'business_startup': be highly pragmatic, action-oriented, and focused on speed and launch feasibility.
- For 'personal_commitment': be structured, supportive, and direct about consistent habits.
- For 'exam_prep' and 'skill_learning': be analytical, focusing on practice, knowledge retention, and topic coverage.
Always return valid JSON.`;

/**
 * Agent 3: Accountability Agent
 * Generates accountability message after check-in.
 */
export const generateAccountabilityMessage = async ({
  goalTitle,
  goalCategory,
  completedToday,
  totalToday,
  blockerNote,
  daysRemaining,
  overallCompleted,
  overallTotal,
}) => {
  const prompt = `Generate a short accountability response (2-3 sentences). Return JSON:
{
  "message": "Direct, actionable feedback message tailored to the goal category"
}

Check-in Data:
- Goal: ${goalTitle}
- Category: ${goalCategory || 'General'}
- Tasks completed today: ${completedToday} of ${totalToday}
- Blocker reported: ${blockerNote || 'None'}
- Days remaining: ${daysRemaining}
- Overall progress: ${overallCompleted}/${overallTotal} tasks done

Guidelines:
- Tone: Match the professional, pragmatic, or supportive tone for the category.
- If all tasks done: brief confirmation + next primary action for tomorrow.
- If partially done: focus on securing the remaining tasks and maintaining pacing.
- If blocker reported: suggest a specific workaround or step to resolve it.
- If falling behind: state the deadline gap directly, and recommend how to get back on track.`;

  return generateJSON(prompt, SYSTEM_INSTRUCTION);
};
