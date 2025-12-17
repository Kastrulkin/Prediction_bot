// Типы для работы с TON (nanotons)
export type Nanotons = string; // Используем string для больших чисел

// Статусы событий
export type EventStatus = 'open' | 'closed' | 'resolved' | 'cancelled';

// Статусы ставок
export type BetStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

// Статусы выплат
export type PayoutStatus = 'pending' | 'paid' | 'failed';

// Сторона ставки
export type BetSide = 'yes' | 'no';

// Исход события
export type EventOutcome = 'yes' | 'no';

// Пользователь
export interface User {
  id: number;
  telegram_id?: number;
  username?: string;
  created_at: Date;
}

// Кошелек
export interface Wallet {
  user_id: number;
  ton_address: string;
  balance_pending: Nanotons;
  updated_at: Date;
}

// Событие
export interface Event {
  id: number;
  creator_id: number;
  title: string;
  description?: string;
  category?: string;
  end_date: Date;
  status: EventStatus;
  contract_address?: string;
  contract_deployed_at?: Date;
  total_yes: Nanotons;
  total_no: Nanotons;
  resolved_outcome?: EventOutcome;
  resolved_at?: Date;
  cancellation_requested: boolean;
  cancellation_reason?: string;
  cancelled_at?: Date;
  refund_fee_bps: number;
  max_bet_percent: number;
  max_probability_change: number;
  created_at: Date;
}

// Ставка
export interface Bet {
  id: number;
  user_id: number;
  event_id: number;
  side: BetSide;
  amount_gross: Nanotons;
  amount_net: Nanotons;
  fee_in: Nanotons;
  tx_hash?: string;
  status: BetStatus;
  price?: number;
  created_at: Date;
}

// Выплата
export interface Payout {
  id: number;
  user_id: number;
  event_id: number;
  bet_id: number;
  amount: Nanotons;
  status: PayoutStatus;
  tx_hash?: string;
  created_at: Date;
  paid_at?: Date;
}

// История пулов
export interface PoolHistory {
  id: number;
  event_id: number;
  total_yes: Nanotons;
  total_no: Nanotons;
  timestamp: Date;
}

// Запрос на отмену
export interface CancellationRequest {
  id: number;
  event_id: number;
  user_id: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

