import { query } from '../db/connection';
import { Bet, BetStatus, BetSide } from '../types';

export class BetModel {
  static async create(betData: Omit<Bet, 'id' | 'created_at'>): Promise<Bet> {
    const result = await query(
      `INSERT INTO bets (
        user_id, event_id, side, amount_gross, amount_net,
        fee_in, tx_hash, status, price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        betData.user_id,
        betData.event_id,
        betData.side,
        betData.amount_gross,
        betData.amount_net,
        betData.fee_in,
        betData.tx_hash || null,
        betData.status || 'pending',
        betData.price || null,
      ]
    );
    return this.mapRowToBet(result.rows[0]);
  }

  static async findById(id: number): Promise<Bet | null> {
    const result = await query('SELECT * FROM bets WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToBet(result.rows[0]);
  }

  static async findByTxHash(txHash: string): Promise<Bet | null> {
    const result = await query('SELECT * FROM bets WHERE tx_hash = $1', [txHash]);
    if (result.rows.length === 0) return null;
    return this.mapRowToBet(result.rows[0]);
  }

  static async findByUserId(userId: number, filters: {
    eventId?: number;
    status?: BetStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ bets: Bet[]; total: number }> {
    const { eventId, status, limit = 20, offset = 0 } = filters;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (eventId) {
      whereClause += ` AND event_id = $${paramIndex}`;
      params.push(eventId);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM bets ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const betsResult = await query(
      `SELECT * FROM bets ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const bets = betsResult.rows.map((row) => this.mapRowToBet(row));

    return { bets, total };
  }

  static async findByEventId(eventId: number): Promise<Bet[]> {
    const result = await query(
      'SELECT * FROM bets WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );
    return result.rows.map((row) => this.mapRowToBet(row));
  }

  static async update(id: number, updates: Partial<Bet>): Promise<Bet | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE bets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToBet(result.rows[0]);
  }

  private static mapRowToBet(row: any): Bet {
    return {
      id: row.id,
      user_id: row.user_id,
      event_id: row.event_id,
      side: row.side,
      amount_gross: row.amount_gross?.toString() || '0',
      amount_net: row.amount_net?.toString() || '0',
      fee_in: row.fee_in?.toString() || '0',
      tx_hash: row.tx_hash,
      status: row.status,
      price: row.price ? parseFloat(row.price) : undefined,
      created_at: row.created_at,
    };
  }
}

