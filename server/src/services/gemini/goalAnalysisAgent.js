import { generateJSON } from './client.js';
import CalendarEvent from '../../models/CalendarEvent.js';

const SYSTEM_INSTRUCTION = `You are a goal analysis expert and professional productivity advisor. 
You assess the feasibility of deadlines, projects, startup launches, personal commitments, event timelines, and exam preparation.
Evaluate whether the goal's timeline is realistic given the user's skill level, context, and daily capacity.
Be highly realistic, objective, and direct. Do not give generic motivational quotes. Focus on practical feasibility.
Always return valid JSON matching the specified schema.`;

/**
 * Agent 1: Goal Analysis Agent
 * Analyzes goal feasibility, risk score, and generates a coach note.
 */
export const analyzeGoal = async (goal) => {
  const daysUntilDeadline = Math.max(1, Math.ceil(
    (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  ));

  const constraintsList = goal.constraints && goal.constraints.length > 0
    ? goal.constraints.map((c) => `- ${c.title} (${c.type}) on ${new Date(c.date).toISOString().split('T')[0]} for duration: ${c.duration || 'N/A'}. Notes: ${c.notes || 'None'}`).join('\n')
    : 'None';
  const eventsList = goal.events && goal.events.length > 0
    ? goal.events.map((e) => `- ${e.name} on ${new Date(e.date).toISOString().split('T')[0]} at ${e.time}`).join('\n')
    : 'None';

  // Fetch cached Google Calendar events overlapping timeline
  const calendarEvents = await CalendarEvent.find({
    userId: goal.userId,
    start: { $lte: new Date(goal.deadline) },
    end: { $gte: goal.createdAt || new Date() },
  });

  const calendarEventsList = calendarEvents && calendarEvents.length > 0
    ? calendarEvents.map((c) => {
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
      }).join('\n')
    : 'None';

  const prompt = `Analyze this commitment goal and return a JSON response with the following structure:
{
  "feasibility": "achievable" | "challenging" | "at_risk" | "unlikely",
  "riskScore": "low" | "medium" | "high",
  "riskReason": "A concise 1-2 sentence explanation of the risk level, focusing on capacity, timeline, upcoming constraints, and events.",
  "coachNote": "A direct 2-3 sentence coaching note with actionable guidance for immediate next steps."
}

Goal Details:
- Title: ${goal.title}
- Category: ${goal.category}
- Deadline: ${goal.deadline} (${daysUntilDeadline} days away)
- Priority: ${goal.priority}
- Daily Available Hours: ${goal.dailyHours} hours/day
- Current Skill Level: ${goal.skillLevel}
- Additional Context: ${goal.context || 'None provided'}

Upcoming Constraints (restricted/unusable capacity days):
${constraintsList}

Upcoming Google Calendar Events (synced schedule conflicts):
${calendarEventsList}

Calendar Events:
${eventsList}

Analysis Guidelines:
1. Feasibility & Risk: Evaluate if ${daysUntilDeadline} days is realistic for a goal of category '${goal.category}' starting at a '${goal.skillLevel}' level, given a daily capacity of ${goal.dailyHours} hours.
2. Consider specific constraints:
   - For 'work_deadline' and 'project': Assess if the time covers development, review, and buffer for execution.
   - For 'business_startup': Consider if the timeline allows for validation, product packaging, and launch activities.
   - For 'event_planning': Assess logistics, booking lead times, and scheduling.
   - For 'personal_commitment': Check consistency, habit formation, or administrative processing times.
   - For 'exam_prep' or 'skill_learning': Review learning curves and practical preparation/review buffers.
3. Factor in user-defined upcoming constraints, calendar events, and synced Google Calendar events (e.g. travel, interviews, exams, meetings). These will reduce the user's working capacity on those dates. If the user has significant conflicts (like travel, exams, or interviews), raise the risk level or specify that adjustments will be needed.
4. Keep the feedback action-oriented, direct, and professional.`;

  return generateJSON(prompt, SYSTEM_INSTRUCTION);
};
