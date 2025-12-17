export type EventStatus = 'open' | 'closed' | 'resolved' | 'cancelled';
export type BetSide = 'yes' | 'no';
export type EventOutcome = 'yes' | 'no';
export type BetStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export interface Event {
  id: number;
  creator_id: number;
  title: string;
  description?: string;
  category?: string;
  end_date: string;
  status: EventStatus;
  contract_address?: string;
  total_yes: string;
  total_no: string;
  resolved_outcome?: EventOutcome;
  created_at: string;
}

export interface Bet {
  id: number;
  user_id: number;
  event_id: number;
  side: BetSide;
  amount_gross: string;
  amount_net: string;
  fee_in: string;
  tx_hash?: string;
  status: BetStatus;
  price?: number;
  created_at: string;
}

export interface User {
  tonAddress: string;
  balance: number;
}

