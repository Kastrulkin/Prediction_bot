import { Request, Response } from 'express';
import { BetModel } from '../models/BetModel';
import { EventModel } from '../models/EventModel';
import { BetService } from '../services/BetService';
import { EventService } from '../services/EventService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { tonToNanotons } from '../utils/constants';

export const createBet = asyncHandler(async (req: Request, res: Response) => {
  const { eventId, side, amount, txHash } = req.body;

  if (!eventId || !side || !amount) {
    throw new AppError('eventId, side, and amount are required', 400);
  }

  if (side !== 'yes' && side !== 'no') {
    throw new AppError('side must be "yes" or "no"', 400);
  }

  // TODO: Получать userId из auth
  const userId = 1;

  // Получаем событие
  const event = await EventModel.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Проверяем, можно ли разместить ставку
  const canBet = EventService.canPlaceBet(event);
  if (!canBet.can) {
    throw new AppError(canBet.reason || 'Cannot place bet', 400);
  }

  // Конвертируем TON в nanotons
  const amountNanotons = tonToNanotons(parseFloat(amount));

  // Валидация размера ставки
  const validation = BetService.validateBetSize(event, amountNanotons, side);
  if (!validation.valid) {
    throw new AppError(validation.reason || 'Invalid bet size', 400);
  }

  // Верификация транзакции, если txHash предоставлен
  if (txHash && event.contract_address) {
    const { getBlockchainService } = await import('../services/BlockchainService');
    const blockchainService = getBlockchainService();
    
    const isValid = await blockchainService.verifyBetTransaction(
      txHash,
      event.contract_address,
      amountNanotons
    );

    if (!isValid) {
      throw new AppError('Transaction verification failed', 400);
    }
  }

  // Создаем ставку
  const bet = await BetService.createBet(userId, eventId, side, amountNanotons, txHash);

  // Получаем обновленное событие для расчета вероятности
  const updatedEvent = await EventModel.findById(eventId);
  const probability = updatedEvent
    ? EventService.calculateProbability(updatedEvent)
    : null;

  res.status(201).json({
    success: true,
    bet,
    validation: {
      maxBetAllowed: validation.maxBetAllowed
        ? (parseFloat(validation.maxBetAllowed) / 1e9).toFixed(2)
        : null,
      probabilityChange: probability
        ? Math.abs(probability.yes - EventService.calculateProbability(event).yes)
        : null,
    },
    message: 'Bet placed successfully',
  });
});

export const getUserBets = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { eventId, status, page = '1', limit = '20' } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const result = await BetModel.findByUserId(parseInt(id), {
    eventId: eventId ? parseInt(eventId as string) : undefined,
    status: status as any,
    limit: parseInt(limit as string),
    offset,
  });

  res.json({
    success: true,
    bets: result.bets,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: result.total,
      totalPages: Math.ceil(result.total / parseInt(limit as string)),
    },
  });
});

