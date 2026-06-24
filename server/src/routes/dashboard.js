import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', getDashboard);

export default router;
