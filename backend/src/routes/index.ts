import { Router } from 'express';
import eventsRouter from './events';
import betsRouter from './bets';
import syncRouter from './sync';

const router = Router();

router.use('/events', eventsRouter);
router.use('/bets', betsRouter);
router.use('/sync', syncRouter);

export default router;

