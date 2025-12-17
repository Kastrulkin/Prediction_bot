import { query } from '../db/connection';
import { Event, EventStatus, EventOutcome } from '../types';

export class EventModel {
  static async create(eventData: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    const result = await query(
      `INSERT INTO events (
        creator_id, title, description, category, end_date, status,
        contract_address, contract_deployed_at, refund_fee_bps,
        max_bet_percent, max_probability_change
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        eventData.creator_id,
        eventData.title,
        eventData.description || null,
        eventData.category || null,
        eventData.end_date,
        eventData.status || 'open',
        eventData.contract_address || null,
        eventData.contract_deployed_at || null,
        eventData.refund_fee_bps || 50,
        eventData.max_bet_percent || 20,
        eventData.max_probability_change || 10,
      ]
    );
    return this.mapRowToEvent(result.rows[0]);
  }

  static async findById(id: number): Promise<Event | null> {
    const result = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToEvent(result.rows[0]);
  }

  static async findAll(filters: {
    status?: EventStatus;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'end_date' | 'total_yes' | 'total_no';
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ events: Event[]; total: number }> {
    const { status, limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = filters;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM events ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const eventsResult = await query(
      `SELECT * FROM events ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const events = eventsResult.rows.map((row) => this.mapRowToEvent(row));

    return { events, total };
  }

  static async update(id: number, updates: Partial<Event>): Promise<Event | null> {
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
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEvent(result.rows[0]);
  }

  static async updatePool(
    id: number,
    totalYes: string,
    totalNo: string
  ): Promise<Event | null> {
    const result = await query(
      'UPDATE events SET total_yes = $1, total_no = $2 WHERE id = $3 RETURNING *',
      [totalYes, totalNo, id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEvent(result.rows[0]);
  }

  static async resolve(
    id: number,
    outcome: EventOutcome
  ): Promise<Event | null> {
    const result = await query(
      `UPDATE events 
       SET status = 'resolved', resolved_outcome = $1, resolved_at = NOW()
       WHERE id = $2 AND status = 'open'
       RETURNING *`,
      [outcome, id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEvent(result.rows[0]);
  }

  private static mapRowToEvent(row: any): Event {
    return {
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      category: row.category,
      end_date: row.end_date,
      status: row.status,
      contract_address: row.contract_address,
      contract_deployed_at: row.contract_deployed_at,
      total_yes: row.total_yes?.toString() || '0',
      total_no: row.total_no?.toString() || '0',
      resolved_outcome: row.resolved_outcome,
      resolved_at: row.resolved_at,
      cancellation_requested: row.cancellation_requested || false,
      cancellation_reason: row.cancellation_reason,
      cancelled_at: row.cancelled_at,
      refund_fee_bps: row.refund_fee_bps || 50,
      max_bet_percent: row.max_bet_percent || 20,
      max_probability_change: row.max_probability_change || 10,
      created_at: row.created_at,
    };
  }
}

