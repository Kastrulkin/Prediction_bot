import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getSyncService } from '../services/SyncService';

const router = Router();

// Ручная синхронизация всех событий
router.post('/all', asyncHandler(async (req, res) => {
  const syncService = getSyncService();
  await syncService.syncAll();
  res.json({ success: true, message: 'Sync completed' });
}));

// Синхронизация конкретного события
router.post('/event/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const syncService = getSyncService();
  const success = await syncService.syncEvent(parseInt(id));
  
  if (success) {
    res.json({ success: true, message: 'Event synced successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to sync event' });
  }
}));

export default router;

