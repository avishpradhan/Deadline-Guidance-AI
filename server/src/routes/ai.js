import { Router } from 'express';
import { analyze, checkinAnalyze, replan, risk, acceptReplan } from '../controllers/aiController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/analyze', analyze);
router.post('/checkin-analyze', checkinAnalyze);
router.post('/replan', replan);
router.post('/replan/accept', acceptReplan);
router.post('/risk', risk);

export default router;
