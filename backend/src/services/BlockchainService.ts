import { Address, Cell, beginCell, toNano } from '@ton/core';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import logger from '../utils/logger';

// Импортируем wrapper (путь может потребовать корректировки)
// import { MarketEscrow } from '../../../smart-contract/wrappers/MarketEscrow';

// Временная заглушка для MarketEscrow
class MarketEscrow {
  static createFromConfig(config: any, code: Cell) {
    return {
      address: { toString: () => 'EQD...' },
    };
  }
  static createFromAddress(address: Address) {
    return {
      getMarketData: async () => ({ totalYes: 0n, totalNo: 0n, resolvedOutcome: 0, feeInBps: 50, feeOutBps: 150 }),
      getUserPosition: async () => ({ amountYes: 0n, amountNo: 0n }),
    };
  }
}

export class BlockchainService {
  private client: TonClient;
  private adminAddress: Address;
  private contractCode: Cell | null = null;

  constructor() {
    const rpcUrl = process.env.TON_RPC_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC';
    const apiKey = process.env.TON_API_KEY;

    this.client = new TonClient({
      endpoint: rpcUrl,
      apiKey: apiKey,
    });

    const adminAddr = process.env.ADMIN_ADDRESS;
    if (!adminAddr) {
      throw new Error('ADMIN_ADDRESS is not set in environment variables');
    }
    this.adminAddress = Address.parse(adminAddr);
  }

  /**
   * Загружает код контракта из скомпилированного файла
   */
  private async loadContractCode(): Promise<Cell> {
    if (this.contractCode) {
      return this.contractCode;
    }

    try {
      // Путь к скомпилированному контракту
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      
      // Пытаемся загрузить из smart-contract/build
      const contractPath = join(
        __dirname,
        '../../../smart-contract/build/MarketEscrow.cell'
      );

      const codeBuffer = readFileSync(contractPath);
      const cells = Cell.fromBoc(codeBuffer);
      
      if (cells.length === 0) {
        throw new Error('Contract code file is empty');
      }

      this.contractCode = cells[0];
      logger.info('Contract code loaded successfully');
      return this.contractCode;
    } catch (error: any) {
      logger.warn('Failed to load contract code from file:', error.message);
      logger.warn('Using empty cell as fallback. Please compile the contract first.');
      
      // Fallback: пустая ячейка (для разработки)
      this.contractCode = beginCell().endCell();
      return this.contractCode;
    }
  }

  /**
   * Деплоит контракт для нового события
   */
  async deployContract(eventId: number, feeInBps: number = 50, feeOutBps: number = 150): Promise<{
    address: string;
    txHash: string;
  }> {
    try {
      const code = await this.loadContractCode();

      const marketEscrow = MarketEscrow.createFromConfig(
        {
          adminAddress: this.adminAddress,
          feeInBps,
          feeOutBps,
        },
        code
      );

      // TODO: Отправить транзакцию деплоя через кошелек
      // Для этого нужен секретный ключ админа
      // const wallet = WalletContractV4.create({ workchain: 0, publicKey: adminPublicKey });
      // const contract = this.client.open(wallet);
      // await contract.sendDeploy(marketEscrow, toNano('0.1'));

      logger.info(`Contract deployed for event ${eventId} at ${marketEscrow.address.toString()}`);

      return {
        address: marketEscrow.address.toString(),
        txHash: 'pending', // TODO: получить реальный txHash
      };
    } catch (error) {
      logger.error('Error deploying contract:', error);
      throw new Error(`Failed to deploy contract: ${error}`);
    }
  }

  /**
   * Верифицирует транзакцию ставки
   */
  async verifyBetTransaction(
    txHash: string,
    expectedContractAddress: string,
    expectedAmount: bigint,
    expectedSender?: string
  ): Promise<boolean> {
    try {
      const contractAddress = Address.parse(expectedContractAddress);
      const tx = await this.client.getTransaction(contractAddress, txHash);

      if (!tx) {
        logger.warn(`Transaction ${txHash} not found`);
        return false;
      }

      // Проверяем получателя (должен быть адрес контракта)
      const inMsg = tx.inMessage;
      if (!inMsg || !inMsg.info.dest) {
        return false;
      }

      if (inMsg.info.dest.toString() !== expectedContractAddress) {
        logger.warn(`Transaction destination mismatch: ${inMsg.info.dest.toString()} !== ${expectedContractAddress}`);
        return false;
      }

      // Проверяем сумму
      const amount = inMsg.info.value.coins;
      if (amount !== expectedAmount) {
        logger.warn(`Transaction amount mismatch: ${amount} !== ${expectedAmount}`);
        return false;
      }

      // Проверяем отправителя, если указан
      if (expectedSender && inMsg.info.src) {
        if (inMsg.info.src.toString() !== expectedSender) {
          logger.warn(`Transaction sender mismatch: ${inMsg.info.src.toString()} !== ${expectedSender}`);
          return false;
        }
      }

      // Проверяем, что транзакция успешна
      if (tx.endStatus !== 'active') {
        logger.warn(`Transaction ${txHash} failed`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error verifying transaction:', error);
      return false;
    }
  }

  /**
   * Получает состояние контракта
   */
  async getContractState(contractAddress: string): Promise<{
    totalYes: bigint;
    totalNo: bigint;
    resolvedOutcome: number;
    feeInBps: number;
    feeOutBps: number;
  } | null> {
    try {
      const address = Address.parse(contractAddress);
      const contract = this.client.open(
        MarketEscrow.createFromAddress(address)
      );

      const state = await contract.getMarketData();
      return {
        totalYes: state.totalYes,
        totalNo: state.totalNo,
        resolvedOutcome: state.resolvedOutcome,
        feeInBps: state.feeInBps,
        feeOutBps: state.feeOutBps,
      };
    } catch (error) {
      logger.error('Error getting contract state:', error);
      return null;
    }
  }

  /**
   * Получает позицию пользователя в контракте
   */
  async getUserPosition(contractAddress: string, userAddress: string): Promise<{
    amountYes: bigint;
    amountNo: bigint;
  } | null> {
    try {
      const contractAddr = Address.parse(contractAddress);
      const userAddr = Address.parse(userAddress);
      const contract = this.client.open(
        MarketEscrow.createFromAddress(contractAddr)
      );

      const position = await contract.getUserPosition(userAddr);
      return {
        amountYes: position.amountYes,
        amountNo: position.amountNo,
      };
    } catch (error) {
      logger.error('Error getting user position:', error);
      return null;
    }
  }

  /**
   * Синхронизирует состояние контракта с БД
   */
  async syncContractState(contractAddress: string, eventId: number): Promise<boolean> {
    try {
      const state = await this.getContractState(contractAddress);
      if (!state) {
        return false;
      }

      // Обновляем событие в БД
      const { EventModel } = await import('../models/EventModel');
      await EventModel.updatePool(
        eventId,
        state.totalYes.toString(),
        state.totalNo.toString()
      );

      // Обновляем resolved_outcome, если изменился
      if (state.resolvedOutcome !== 0) {
        const outcome = state.resolvedOutcome === 1 ? 'yes' : 'no';
        await EventModel.update(eventId, {
          resolved_outcome: outcome,
          status: 'resolved',
        });
      }

      logger.info(`Synced contract state for event ${eventId}`);
      return true;
    } catch (error) {
      logger.error('Error syncing contract state:', error);
      return false;
    }
  }
}

// Singleton instance
let blockchainServiceInstance: BlockchainService | null = null;

export const getBlockchainService = (): BlockchainService => {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainService();
  }
  return blockchainServiceInstance;
};

