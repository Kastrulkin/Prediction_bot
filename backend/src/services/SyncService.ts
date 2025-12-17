import { EventModel } from '../models/EventModel';
import { getBlockchainService } from './BlockchainService';
import logger from '../utils/logger';

/**
 * Сервис для синхронизации состояния контрактов с БД
 */
export class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Запускает периодическую синхронизацию
   */
  start(intervalMs: number = 60000) {
    if (this.isRunning) {
      logger.warn('Sync service is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Starting sync service with interval ${intervalMs}ms`);

    // Синхронизируем сразу при запуске
    this.syncAll();

    // Затем периодически
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);
  }

  /**
   * Останавливает синхронизацию
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    logger.info('Sync service stopped');
  }

  /**
   * Синхронизирует все открытые события
   */
  async syncAll() {
    try {
      const { events } = await EventModel.findAll({
        status: 'open',
        limit: 100,
      });

      const blockchainService = getBlockchainService();
      let synced = 0;
      let failed = 0;

      for (const event of events) {
        if (!event.contract_address) {
          continue;
        }

        try {
          const success = await blockchainService.syncContractState(
            event.contract_address,
            event.id
          );
          if (success) {
            synced++;
          } else {
            failed++;
          }
        } catch (error) {
          logger.error(`Error syncing event ${event.id}:`, error);
          failed++;
        }
      }

      logger.info(`Sync completed: ${synced} synced, ${failed} failed`);
    } catch (error) {
      logger.error('Error in syncAll:', error);
    }
  }

  /**
   * Синхронизирует конкретное событие
   */
  async syncEvent(eventId: number) {
    try {
      const event = await EventModel.findById(eventId);
      if (!event || !event.contract_address) {
        return false;
      }

      const blockchainService = getBlockchainService();
      return await blockchainService.syncContractState(
        event.contract_address,
        event.id
      );
    } catch (error) {
      logger.error(`Error syncing event ${eventId}:`, error);
      return false;
    }
  }
}

// Singleton instance
let syncServiceInstance: SyncService | null = null;

export const getSyncService = (): SyncService => {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
};

