import { Router } from 'express';
import {
  getAuthUrl,
  authCallback,
  disconnectCalendar,
  syncCalendar,
  getCalendarIntelligence,
} from '../controllers/calendarController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Callback URL handled directly by Google (auth details are linked via state JWT)
router.get('/auth/callback', authCallback);

// Protected endpoints requiring standard JWT authentication
router.get('/auth/url', auth, getAuthUrl);
router.post('/disconnect', auth, disconnectCalendar);
router.post('/sync', auth, syncCalendar);
router.get('/intelligence', auth, getCalendarIntelligence);

export default router;
