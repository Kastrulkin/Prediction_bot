import { Router } from 'express';
import * as betController from '../controllers/betController';
import { betLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', betLimiter, betController.createBet);
router.get('/user/:id', betController.getUserBets);

export default router;

