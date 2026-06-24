import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import { classifyEvent, getCalendarConflictHours } from '../utils/calendarHelper.js';
import { calculateGoalForecast } from '../utils/forecastEngine.js';
import { refreshDecisionInsight } from '../utils/decisionHelper.js';

/**
 * Returns a configured Google OAuth2 Client.
 */
const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * GET /api/calendar/auth/url
 * Generates the redirect URL for Google Calendar permission consent
 */
export const getAuthUrl = (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      return res.status(400).json({
        error: "Google OAuth credentials are not configured on the server. Please define GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your server's .env file."
      });
    }
    const oauth2Client = getOAuthClient();
    // Encode userId in state parameter using JWT to match stateless context in callback
    const state = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // force user consent screen to retrieve refresh token
      scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events.readonly'],
      state,
    });
    res.json({ url: authUrl });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/calendar/auth/callback
 * Google callback endpoint to exchange oauth code for tokens
 */
export const authCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ error: 'OAuth authorization code or state is missing.' });
    }

    // Verify state to identify user
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    const updateData = {
      googleAccessToken: tokens.access_token,
      googleCalendarConnected: true,
    };

    if (tokens.refresh_token) {
      updateData.googleRefreshToken = tokens.refresh_token;
    }
    if (tokens.expiry_date) {
      updateData.googleTokenExpiry = new Date(tokens.expiry_date);
    }

    await User.findByIdAndUpdate(userId, updateData);

    const clientUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.CLIENT_URL || 'http://localhost:5173') 
      : 'http://localhost:5173';
    
    // Redirect back to frontend
    res.redirect(`${clientUrl}/dashboard?calendar_connected=true`);
  } catch (err) {
    console.error('Google OAuth Callback Error:', err);
    const clientUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.CLIENT_URL || 'http://localhost:5173') 
      : 'http://localhost:5173';
    res.redirect(`${clientUrl}/dashboard?calendar_error=true`);
  }
};

/**
 * POST /api/calendar/disconnect
 * Disconnects the calendar and deletes cached events
 */
export const disconnectCalendar = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleCalendarConnected: false,
    });

    // Clean up cached events
    await CalendarEvent.deleteMany({ userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to ensure access tokens are refreshed using refresh tokens
 */
const getAuthenticatedClient = async (user) => {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : null,
  });

  // If token is expired or expires within next 60 seconds
  const isExpired = user.googleTokenExpiry && (user.googleTokenExpiry.getTime() - Date.now() < 60000);
  if (isExpired && user.googleRefreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      
      user.googleAccessToken = credentials.access_token;
      if (credentials.expiry_date) {
        user.googleTokenExpiry = new Date(credentials.expiry_date);
      }
      await user.save();
    } catch (err) {
      console.error('Failed to automatically refresh Google Calendar token:', err);
      throw new Error('Google access token expired and auto-refresh failed. Please reconnect calendar.');
    }
  }

  return oauth2Client;
};

/**
 * POST /api/calendar/sync
 * Fetches upcoming 30 days of calendar events, processes them into constraints, and stores them.
 */
export const syncCalendar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleCalendarConnected || !user.googleAccessToken) {
      return res.status(400).json({ error: 'Google Calendar connection is active but credentials missing.' });
    }

    const authClient = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);
    timeMax.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Clear previous items to avoid duplicate caching
    await CalendarEvent.deleteMany({ userId: req.user._id, source: 'google-calendar' });

    const savedEvents = [];

    for (const e of events) {
      const start = e.start.dateTime || e.start.date;
      const end = e.end.dateTime || e.end.date;
      const title = e.summary || 'Untitled Event';
      
      const isAllDay = !e.start.dateTime;
      const durationStr = isAllDay 
        ? 'all-day' 
        : `${((new Date(end) - new Date(start)) / (1000 * 60 * 60)).toFixed(1)} hours`;
      
      const type = classifyEvent(title);

      const newEvent = await CalendarEvent.create({
        userId: req.user._id,
        googleEventId: e.id,
        title,
        start: new Date(start),
        end: new Date(end),
        type,
        duration: durationStr,
        source: 'google-calendar',
      });
      savedEvents.push(newEvent);
    }
    // Recalculate forecasts & decision insights for all active goals
    const activeGoals = await Goal.find({ userId: req.user._id, status: 'active' });
    for (const activeGoal of activeGoals) {
      await refreshDecisionInsight(activeGoal._id, req.user._id);
    }

    res.json({ success: true, count: savedEvents.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/calendar/intelligence
 * Computes calendar events list and timeline capacity impact for a specific goal
 */
export const getCalendarIntelligence = async (req, res, next) => {
  try {
    const { goalId } = req.query;
    if (!goalId) {
      return res.status(400).json({ error: 'goalId parameter is required.' });
    }

    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    const tasks = await Task.find({ goalId });
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const remaining = total - completed;
    const estimatedHoursRemaining = tasks
      .filter((t) => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const startDate = goal.createdAt || new Date();
    const endDate = goal.deadline;

    // Retrieve events overlapping this specific goal timeline
    const events = await CalendarEvent.find({
      userId: req.user._id,
      start: { $lte: endDate },
      end: { $gte: startDate },
    }).sort({ start: 1 });

    const calendarConflictHours = await getCalendarConflictHours(
      req.user._id,
      startDate,
      endDate,
      goal.dailyHours
    );

    // Forecast BEFORE calendar conflicts
    const forecastBefore = calculateGoalForecast({
      createdAt: goal.createdAt,
      deadline: goal.deadline,
      dailyHours: goal.dailyHours,
      priority: goal.priority,
      totalTasks: total,
      completedTasks: completed,
      remainingTasks: remaining,
      estimatedHoursRemaining,
      calendarConflictHours: 0,
    });

    // Forecast AFTER calendar conflicts
    const forecastAfter = calculateGoalForecast({
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

    const eventList = events.map(e => ({
      title: e.title,
      type: e.type,
      start: e.start,
      end: e.end,
      duration: e.duration,
    }));

    const probabilityDelta = forecastAfter.successProbability - forecastBefore.successProbability;
    
    const hoursImpactMessage = calendarConflictHours > 0
      ? `This reduces available capacity by ${calendarConflictHours} hour${calendarConflictHours !== 1 ? 's' : ''}.`
      : 'No timeline conflicts detected from synced events.';

    const probabilityImpactMessage = probabilityDelta < 0
      ? `Success probability changed from ${forecastBefore.successProbability}% to ${forecastAfter.successProbability}% (a drop of ${Math.abs(probabilityDelta)}%).`
      : `Success probability remains stable at ${forecastAfter.successProbability}%.`;

    res.json({
      events: eventList,
      totalConflictHours: calendarConflictHours,
      impactAnalysis: {
        capacityReducedText: hoursImpactMessage,
        probabilityChangedText: probabilityImpactMessage,
        beforeProbability: forecastBefore.successProbability,
        afterProbability: forecastAfter.successProbability,
        delta: probabilityDelta,
      },
    });
  } catch (err) {
    next(err);
  }
};
