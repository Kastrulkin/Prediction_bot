import { Request, Response } from 'express';
import { EventModel } from '../models/EventModel';
import { EventService } from '../services/EventService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    page = '1',
    limit = '20',
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const result = await EventModel.findAll({
    status: status as any,
    limit: parseInt(limit as string),
    offset,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
  });

  res.json({
    success: true,
    events: result.events,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: result.total,
      totalPages: Math.ceil(result.total / parseInt(limit as string)),
    },
  });
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await EventService.getEventWithCalculations(parseInt(id));
  if (!result) {
    throw new AppError('Event not found', 404);
  }

  res.json({
    success: true,
    ...result,
  });
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, category, end_date, creator_id } = req.body;

  if (!title || !end_date) {
    throw new AppError('Title and end_date are required', 400);
  }

  // TODO: Проверить залог 0.01 TON от создателя
  // const depositTxHash = req.headers['x-deposit-tx-hash'];
  // if (!depositTxHash) {
  //   throw new AppError('Deposit transaction required', 400);
  // }

  // Создаем событие в БД
  const event = await EventModel.create({
    creator_id: creator_id || 1, // TODO: Получать из auth
    title,
    description,
    category,
    end_date: new Date(end_date),
    status: 'open',
    total_yes: '0',
    total_no: '0',
    cancellation_requested: false,
    refund_fee_bps: 50,
    max_bet_percent: 20,
    max_probability_change: 10,
  });

  // Деплоим контракт
  try {
    const { getBlockchainService } = await import('../services/BlockchainService');
    const blockchainService = getBlockchainService();
    
    const deployment = await blockchainService.deployContract(
      event.id,
      50, // fee_in_bps
      150 // fee_out_bps
    );

    // Обновляем событие с адресом контракта
    const updatedEvent = await EventModel.update(event.id, {
      contract_address: deployment.address,
      contract_deployed_at: new Date(),
    });

    res.status(201).json({
      success: true,
      event: updatedEvent,
      contract_address: deployment.address,
      deployment_tx: deployment.txHash,
      message: 'Event created and contract deployed successfully',
    });
  } catch (error: any) {
    // Если деплой не удался, все равно возвращаем событие
    logger.error('Failed to deploy contract:', error);
    res.status(201).json({
      success: true,
      event,
      warning: 'Event created but contract deployment failed. Please retry.',
      message: 'Event created successfully',
    });
  }
});

export const resolveEvent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { outcome } = req.body;

  if (!outcome || (outcome !== 'yes' && outcome !== 'no')) {
    throw new AppError('Invalid outcome. Must be "yes" or "no"', 400);
  }

  // TODO: Проверка админа
  // TODO: Вызов контракта для разрешения

  const event = await EventModel.resolve(parseInt(id), outcome);
  if (!event) {
    throw new AppError('Event not found or already resolved', 404);
  }

  res.json({
    success: true,
    event,
    message: 'Event resolved successfully',
  });
});

