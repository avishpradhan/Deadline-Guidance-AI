import { generateJSON } from './client.js';
import CalendarEvent from '../../models/CalendarEvent.js';

const SYSTEM_INSTRUCTION = `You are a Deadline Rescue and recovery planning expert. When users fall behind on their commitments, 
you generate proactive "Deadline Rescue" plans that prioritize high-impact steps, combine work, and drop low-priority items.
Be highly practical and professional — restructure the tasks realistically so the user can complete the goal before the deadline.
Always return valid JSON.`;

/**
 * Agent 5: Recovery / Replanning Agent
 * Generates a compressed recovery plan for behind-schedule goals.
 */
export const generateRecoveryPlan = async ({
  userId,
  goalTitle,
  missedTasks,
  daysRemaining,
  dailyHours,
  skillLevel,
  createdAt,
  deadline,
}) => {
  const missedTaskTitles = missedTasks.map((t) => t.title || t).join('\n  - ');

  // Fetch cached Google Calendar events overlapping timeline
  let calendarEventsList = 'None';
  if (userId && deadline) {
    const calendarEvents = await CalendarEvent.find({
      userId,
      start: { $lte: new Date(deadline) },
      end: { $gte: createdAt ? new Date(createdAt) : new Date() },
    });
    if (calendarEvents && calendarEvents.length > 0) {
      calendarEventsList = calendarEvents.map((c) => {
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
      }).join('\n');
    }
  }

  const prompt = `Create a compressed Deadline Rescue recovery plan. Return JSON:
{
  "recoveryPlan": {
    "message": "Encouraging statement confirming the activation of Deadline Rescue and overall status.",
    "currentProgress": "Summary of current progress (completed vs pending tasks) and capacity constraints (1-2 sentences).",
    "riskAssessment": "Clear explanation of why the deadline is at risk based on capacity, pending tasks, and remaining days (1-2 sentences).",
    "rescueStrategy": "Proactive description of how tasks are consolidated, combined, or reprioritized to save the deadline (1-2 sentences).",
    "recoveredTimeline": "Clear explanation of how the new schedule ensures delivery by the deadline (1-2 sentences).",
    "revisedTasks": [
      {
        "title": "Task name (combining or reprioritize pending tasks)",
        "estimatedHours": 2,
        "dueDate": "YYYY-MM-DD"
      }
    ]
  }
}

Situation:
- Goal: ${goalTitle}
- Missed/pending tasks:
  - ${missedTaskTitles}
- Days remaining: ${daysRemaining}
- Daily capacity: ${dailyHours} hours
- Skill level: ${skillLevel}
- Upcoming Google Calendar Events (synced schedule conflicts):
  ${calendarEventsList}

Recovery/Rescue rules:
1. Prioritize high-impact tasks (focus on critical deliverables).
2. Consolidate and combine related tasks to save overhead.
3. Drop or simplify low-impact tasks if the deadline is extremely tight.
4. Total task hours per day must not exceed the capacity of ${dailyHours} hours. Also, do not schedule revised tasks on dates with all-day travel or major conflicts.
5. All revised tasks must start from today: ${new Date().toISOString().split('T')[0]}.
6. Be realistic — design a plan that is achievable and prevents burnout.`;

  return generateJSON(prompt, SYSTEM_INSTRUCTION);
};
