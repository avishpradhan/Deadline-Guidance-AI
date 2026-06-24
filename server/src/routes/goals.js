import { Router } from 'express';
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  completeGoal,
} from '../controllers/goalController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth); // All goal routes require auth

router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/complete', completeGoal);

export default router;
