import CalendarEvent from '../models/CalendarEvent.js';

/**
 * Classifies an event summary into an internal constraint type.
 */
export const classifyEvent = (title) => {
  if (!title) return 'other';
  const t = title.toLowerCase();
  
  if (
    t.includes('travel') || 
    t.includes('trip') || 
    t.includes('flight') || 
    t.includes('vacation') || 
    t.includes('holiday') || 
    t.includes('delhi') || 
    t.includes('mumbai') || 
    t.includes('bangalore')
  ) {
    return 'travel';
  }
  if (
    t.includes('exam') || 
    t.includes('quiz') || 
    t.includes('test') || 
    t.includes('midterm') || 
    t.includes('final') || 
    t.includes('paper') || 
    t.includes('sem')
  ) {
    return 'exam';
  }
  if (
    t.includes('interview') || 
    t.includes('hiring') || 
    t.includes('assessment') || 
    t.includes('portfolio') || 
    t.includes('recruiting')
  ) {
    return 'interview';
  }
  if (
    t.includes('hackathon') || 
    t.includes('hack') || 
    t.includes('coding contest') || 
    t.includes('jam')
  ) {
    return 'hackathon';
  }
  if (
    t.includes('meeting') || 
    t.includes('sync') || 
    t.includes('call') || 
    t.includes('standup') || 
    t.includes('1:1') || 
    t.includes('one-on-one') || 
    t.includes('scrum') || 
    t.includes('discussion')
  ) {
    return 'meeting';
  }
  if (
    t.includes('deadline') || 
    t.includes('due') || 
    t.includes('submission') || 
    t.includes('hand-in') || 
    t.includes('turnin')
  ) {
    return 'work_deadline';
  }
  if (
    t.includes('wedding') || 
    t.includes('birthday') || 
    t.includes('anniversary') || 
    t.includes('party') || 
    t.includes('family') || 
    t.includes('marriage') || 
    t.includes('dinner')
  ) {
    return 'family_event';
  }
  return 'other';
};

/**
 * Calculates how many hours of goal capacity are conflicted by calendar events.
 * Clamps daily conflict hours to the configured dailyHours capacity limit.
 */
export const getCalendarConflictHours = async (userId, startDate, endDate, dailyHours) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Fetch events overlapping this interval
  const events = await CalendarEvent.find({
    userId,
    start: { $lte: end },
    end: { $gte: start },
  });

  const dailyCapacityMap = {}; // dateString -> conflictHours

  for (const event of events) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Determine overlapping start and end between event and goal timeline
    const overlapStart = new Date(Math.max(eventStart, start));
    const overlapEnd = new Date(Math.min(eventEnd, end));

    if (overlapStart >= overlapEnd) continue;

    if (event.duration === 'all-day') {
      // Loop day-by-day and set entire capacity as conflicted
      const tempDate = new Date(overlapStart);
      tempDate.setHours(0, 0, 0, 0);
      while (tempDate < overlapEnd) {
        const dateStr = tempDate.toISOString().split('T')[0];
        dailyCapacityMap[dateStr] = dailyHours; 
        tempDate.setDate(tempDate.getDate() + 1);
      }
    } else {
      // Hourly event
      const tempDate = new Date(overlapStart);
      tempDate.setHours(0, 0, 0, 0);
      
      const lastDate = new Date(overlapEnd);
      lastDate.setHours(23, 59, 59, 999);

      while (tempDate <= lastDate) {
        const dateStr = tempDate.toISOString().split('T')[0];
        
        const dayStart = new Date(tempDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(tempDate);
        dayEnd.setHours(23, 59, 59, 999);

        const currentStart = new Date(Math.max(overlapStart, dayStart));
        const currentEnd = new Date(Math.min(overlapEnd, dayEnd));

        if (currentStart < currentEnd) {
          const hours = (currentEnd - currentStart) / (1000 * 60 * 60);
          dailyCapacityMap[dateStr] = (dailyCapacityMap[dateStr] || 0) + hours;
        }

        tempDate.setDate(tempDate.getDate() + 1);
      }
    }
  }

  // Sum up clamped conflict hours for each day
  let totalConflictHours = 0;
  Object.keys(dailyCapacityMap).forEach((dateStr) => {
    const dailyHoursLost = Math.min(dailyHours, dailyCapacityMap[dateStr]);
    totalConflictHours += dailyHoursLost;
  });

  return parseFloat(totalConflictHours.toFixed(1));
};
