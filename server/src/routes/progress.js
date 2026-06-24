import { Router } from 'express';
import { checkin, getHistory } from '../controllers/progressController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/checkin', checkin);
router.get('/:goalId/history', getHistory);

export default router;
