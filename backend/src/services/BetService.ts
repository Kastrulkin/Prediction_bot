import { BetModel } from '../models/BetModel';
import { EventModel } from '../models/EventModel';
import { Event, Bet, BetSide, Nanotons } from '../types';
import {
  MIN_BET_NANOTONS,
  MAX_BET_NANOTONS,
  FEE_IN_BPS,
  MAX_BET_PERCENT,
  MAX_PROBABILITY_CHANGE,
  nanotonsToTon,
} from '../utils/constants';

export class BetService {
  /**
   * Валидация размера ставки
   */
  static validateBetSize(
    event: Event,
    betAmount: bigint,
    side: BetSide
  ): { valid: boolean; reason?: string; maxBetAllowed?: string } {
    // Проверка минимальной/максимальной ставки
    if (betAmount < MIN_BET_NANOTONS) {
      return {
        valid: false,
        reason: `Minimum bet is ${nanotonsToTon(MIN_BET_NANOTONS)} TON`,
      };
    }

    if (betAmount > MAX_BET_NANOTONS) {
      return {
        valid: false,
        reason: `Maximum bet is ${nanotonsToTon(MAX_BET_NANOTONS)} TON`,
      };
    }

    // Проверка лимита на размер ставки (20% от пула)
    const currentPool = side === 'yes' ? BigInt(event.total_yes) : BigInt(event.total_no);
    if (currentPool > 0n) {
      const maxBet = (currentPool * BigInt(MAX_BET_PERCENT)) / 100n;
      if (betAmount > maxBet) {
        return {
          valid: false,
          reason: `Bet too large. Maximum: ${nanotonsToTon(maxBet)} TON (${MAX_BET_PERCENT}% of pool)`,
          maxBetAllowed: maxBet.toString(),
        };
      }
    }

    // Проверка изменения вероятности (10%)
    const totalYes = BigInt(event.total_yes);
    const totalNo = BigInt(event.total_no);
    const total = totalYes + totalNo;

    if (total > 0n) {
      const currentProb = Number(totalYes) / Number(total);
      const newTotalYes = side === 'yes' ? totalYes + betAmount : totalYes;
      const newTotalNo = side === 'no' ? totalNo + betAmount : totalNo;
      const newTotal = newTotalYes + newTotalNo;
      const newProb = Number(newTotalYes) / Number(newTotal);
      const probChange = Math.abs(newProb - currentProb);

      if (probChange > MAX_PROBABILITY_CHANGE / 100) {
        return {
          valid: false,
          reason: `Bet would change probability by ${(probChange * 100).toFixed(2)}%. Maximum: ${MAX_PROBABILITY_CHANGE}%`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Вычисляет комиссию fee_in
   */
  static calculateFeeIn(amount: bigint): { feeIn: bigint; amountNet: bigint } {
    const feeIn = (amount * BigInt(FEE_IN_BPS)) / 10000n;
    const amountNet = amount - feeIn;
    return { feeIn, amountNet };
  }

  /**
   * Вычисляет вероятность на момент ставки
   */
  static calculatePrice(event: Event): number {
    const totalYes = BigInt(event.total_yes);
    const totalNo = BigInt(event.total_no);
    const total = totalYes + totalNo;

    if (total === 0n) {
      return 0.5; // По умолчанию 50%
    }

    return Number(totalYes) / Number(total);
  }

  /**
   * Создает ставку
   */
  static async createBet(
    userId: number,
    eventId: number,
    side: BetSide,
    amountGross: bigint,
    txHash?: string
  ): Promise<Bet> {
    const event = await EventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Валидация
    const validation = this.validateBetSize(event, amountGross, side);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid bet size');
    }

    // Вычисляем комиссию и чистую сумму
    const { feeIn, amountNet } = this.calculateFeeIn(amountGross);

    // Вычисляем вероятность на момент ставки
    const price = this.calculatePrice(event);

    // Обновляем пулы в событии
    const newTotalYes =
      side === 'yes'
        ? (BigInt(event.total_yes) + amountNet).toString()
        : event.total_yes;
    const newTotalNo =
      side === 'no'
        ? (BigInt(event.total_no) + amountNet).toString()
        : event.total_no;

    await EventModel.updatePool(eventId, newTotalYes, newTotalNo);

    // Создаем ставку
    const bet = await BetModel.create({
      user_id: userId,
      event_id: eventId,
      side,
      amount_gross: amountGross.toString(),
      amount_net: amountNet.toString(),
      fee_in: feeIn.toString(),
      tx_hash: txHash,
      status: txHash ? 'confirmed' : 'pending',
      price,
    });

    return bet;
  }
}

