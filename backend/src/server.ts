import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/connection';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// API routes
import apiRouter from './routes';
app.use('/api', apiRouter);

app.get('/api', (req, res) => {
  res.json({ message: 'PredictionBot API v1.0' });
});

// Error handling
app.use(errorHandler);

// Запуск сервера
app.listen(PORT, async () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Запускаем сервис синхронизации с блокчейном
  if (process.env.ENABLE_SYNC !== 'false') {
    try {
      const { getSyncService } = await import('./services/SyncService');
      const syncService = getSyncService();
      const syncInterval = parseInt(process.env.SYNC_INTERVAL_MS || '60000');
      syncService.start(syncInterval);
      logger.info(`🔄 Blockchain sync service started (interval: ${syncInterval}ms)`);
    } catch (error) {
      logger.warn('Failed to start sync service:', error);
    }
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutdown signal received: closing services');
  
  // Останавливаем синхронизацию
  try {
    const { getSyncService } = await import('./services/SyncService');
    const syncService = getSyncService();
    syncService.stop();
  } catch (error) {
    // Игнорируем ошибки при остановке
  }
  
  // Закрываем подключение к БД
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

