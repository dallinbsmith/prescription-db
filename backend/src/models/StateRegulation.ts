import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface StateRegulation {
  id: string;
  state_code: string;
  regulation_type: string;
  applies_to: string;
  description: string | null;
  source_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export const StateRegulationModel = {
  findById: async (id: string): Promise<StateRegulation | null> => {
    return queryOne<StateRegulation>('SELECT * FROM state_regulations WHERE id = $1', [id]);
  },

  findByState: async (stateCode: string): Promise<StateRegulation[]> => {
    return query<StateRegulation>(
      'SELECT * FROM state_regulations WHERE state_code = $1 ORDER BY regulation_type',
      [stateCode]
    );
  },

  findAll: async (): Promise<StateRegulation[]> => {
    return query<StateRegulation>('SELECT * FROM state_regulations ORDER BY state_code, regulation_type');
  },

  create: async (data: Omit<StateRegulation, 'id' | 'created_at' | 'updated_at'>): Promise<StateRegulation> => {
    const id = uuid();
    const result = await queryOne<StateRegulation>(
      `INSERT INTO state_regulations (id, state_code, regulation_type, applies_to, description, source_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, data.state_code, data.regulation_type, data.applies_to, data.description, data.source_url, data.notes]
    );
    return result!;
  },

  update: async (id: string, updates: Partial<StateRegulation>): Promise<StateRegulation | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = ['state_code', 'regulation_type', 'applies_to', 'description', 'source_url', 'notes'];

    for (const field of allowedFields) {
      if (field in updates) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field as keyof StateRegulation]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return StateRegulationModel.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    return queryOne<StateRegulation>(
      `UPDATE state_regulations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await queryOne<{ id: string }>('DELETE FROM state_regulations WHERE id = $1 RETURNING id', [id]);
    return result !== null;
  },

  getDistinctStates: async (): Promise<string[]> => {
    const result = await query<{ state_code: string }>(
      'SELECT DISTINCT state_code FROM state_regulations ORDER BY state_code'
    );
    return result.map(r => r.state_code);
  },
};
