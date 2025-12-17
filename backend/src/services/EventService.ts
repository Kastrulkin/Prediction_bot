import { EventModel } from '../models/EventModel';
import { Event, EventStatus } from '../types';
import { nanotonsToTon } from '../utils/constants';

export class EventService {
  /**
   * Вычисляет вероятность YES
   */
  static calculateProbability(event: Event): { yes: number; no: number } {
    const totalYes = BigInt(event.total_yes);
    const totalNo = BigInt(event.total_no);
    const total = totalYes + totalNo;

    if (total === 0n) {
      return { yes: 0.5, no: 0.5 }; // По умолчанию 50/50
    }

    const yesProb = Number(totalYes) / Number(total);
    return {
      yes: yesProb,
      no: 1 - yesProb,
    };
  }

  /**
   * Вычисляет коэффициенты
   */
  static calculateCoefficients(event: Event): { yes: number; no: number } | null {
    const prob = this.calculateProbability(event);

    if (prob.yes === 0 || prob.no === 0) {
      return null; // Невозможно вычислить коэффициент
    }

    return {
      yes: 1 / prob.yes,
      no: 1 / prob.no,
    };
  }

  /**
   * Получает событие с дополнительными вычисленными полями
   */
  static async getEventWithCalculations(id: number): Promise<{
    event: Event;
    probability: { yes: number; no: number };
    coefficients: { yes: number; no: number } | null;
    totalPool: number;
  } | null> {
    const event = await EventModel.findById(id);
    if (!event) return null;

    const probability = this.calculateProbability(event);
    const coefficients = this.calculateCoefficients(event);
    const totalPool = nanotonsToTon(BigInt(event.total_yes) + BigInt(event.total_no));

    return {
      event,
      probability,
      coefficients,
      totalPool,
    };
  }

  /**
   * Проверяет, можно ли разместить ставку на событие
   */
  static canPlaceBet(event: Event): { can: boolean; reason?: string } {
    if (event.status !== 'open') {
      return { can: false, reason: 'Event is not open' };
    }

    const now = new Date();
    if (new Date(event.end_date) < now) {
      return { can: false, reason: 'Event has ended' };
    }

    return { can: true };
  }
}

