import { generateJSON } from './client.js';
import CalendarEvent from '../../models/CalendarEvent.js';

const SYSTEM_INSTRUCTION = `You are a professional task decomposition planner. You break complex projects, business launches, events, personal commitments, or study courses into structured, phased, day-by-day task lists.
Each task must be a specific, actionable deliverable with a time estimate. Group tasks into logical, chronological phases.
Align task complexity and sequencing with the user's skill level.
Always return valid JSON matching the specified schema.`;

/**
 * Agent 2: Task Decomposition Agent
 * Breaks a goal into a phase-wise day-by-day task plan.
 */
export const decomposeTasks = async (goal, analysis) => {
  const daysUntilDeadline = Math.max(1, Math.ceil(
    (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  ));

  const startDate = new Date();
  const startDateStr = startDate.toISOString().split('T')[0];

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

  const prompt = `Break this goal into a detailed, phased task plan. Return JSON:
{
  "phases": [
    {
      "name": "Phase name (e.g., 'Phase 1: Foundation & Setup')",
      "tasks": [
        {
          "title": "Specific, actionable task name",
          "estimatedHours": 1.5,
          "dueDate": "YYYY-MM-DD"
        }
      ]
    }
  ]
}

Goal: ${goal.title}
Category: ${goal.category}
Start Date: ${startDateStr}
Deadline: ${goal.deadline} (${daysUntilDeadline} days)
Daily Available Hours: ${goal.dailyHours} hours/day
Skill Level: ${goal.skillLevel}
Context: ${goal.context || 'None'}
Risk Assessment: ${analysis?.riskScore || 'medium'} - ${analysis?.riskReason || ''}

Upcoming Constraints (restricted/unusable capacity days):
${constraintsList}

Upcoming Google Calendar Events (synced schedule conflicts):
${calendarEventsList}

Calendar Events:
${eventsList}

Rules:
1. Daily Capacity: The sum of estimated task hours assigned to any single day must not exceed ${goal.dailyHours} hours.
2. Phases: Group tasks into 2-4 logical, chronological phases relevant to the category (e.g., 'Phase 1: Planning & Setup', 'Phase 2: Execution/Build', 'Phase 3: Launch/Review').
3. Task Granularity: Each task should be 0.5 to 3 hours. Titles must start with an action verb and state the exact output (e.g., "Draft Q3 email marketing template" instead of "Work on emails").
4. Due dates: Must be distributed between ${startDateStr} and ${goal.deadline}.
5. Category-Specific Design:
   - For 'work_deadline' and 'project': Include initial planning/setup, core implementation/execution milestones, testing/review, and final delivery/handover.
   - For 'business_startup': Include target research, collateral drafting, technical/platform setup, launch sequence tasks, and initial outreach.
   - For 'event_planning': Include timeline budgeting, venue/vendor coordination, invites distribution, logistics setup, and event rehearsal/run-through.
   - For 'personal_commitment': Include research & prep, document filing/purchasing, execution steps, and final verification.
   - For 'exam_prep' and 'skill_learning': Include concept understanding, practical exercises, full mock tests, and final weak-area review.
6. Constraints & Events Handling:
   - Carefully review "Upcoming Constraints", "Upcoming Google Calendar Events", and "Calendar Events".
   - For any date that has a constraint or event (especially travel, exam, interview, family event, work deadline), DO NOT schedule tasks on that date, or reduce the capacity allocated to that date to 0 or 1 hour.
   - If an exam, interview, or major deadline is scheduled on a specific date, you MUST schedule preparation, practice, or setup tasks *prior* to that date, ensuring the user is ready.
   - Do not schedule regular tasks on dates that have events, travel, or other major constraints. Reschedule them to adjacent days (before or after) while still staying within the daily capacity limit of ${goal.dailyHours} hours/day.
7. Generate between ${Math.min(daysUntilDeadline, 5)} and ${Math.min(daysUntilDeadline * 2, 30)} tasks total.`;

  return generateJSON(prompt, SYSTEM_INSTRUCTION);
};
