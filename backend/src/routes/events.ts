import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { eventCreationLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/', eventCreationLimiter, eventController.createEvent);
router.post('/:id/resolve', eventController.resolveEvent);

export default router;

