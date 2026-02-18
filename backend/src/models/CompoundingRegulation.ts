import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface CompoundingRegulation {
  id: string;
  regulation_type: '503A' | '503B' | 'STATE' | 'USP';
  state_code: string | null;
  title: string;
  description: string | null;
  requirements: object | null;
  source_url: string | null;
  effective_date: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export const CompoundingRegulationModel = {
  findById: async (id: string): Promise<CompoundingRegulation | null> => {
    return queryOne<CompoundingRegulation>('SELECT * FROM compounding_regulations WHERE id = $1', [id]);
  },

  findByType: async (regulationType: string): Promise<CompoundingRegulation[]> => {
    return query<CompoundingRegulation>(
      'SELECT * FROM compounding_regulations WHERE regulation_type = $1 ORDER BY title',
      [regulationType]
    );
  },

  findByState: async (stateCode: string): Promise<CompoundingRegulation[]> => {
    return query<CompoundingRegulation>(
      'SELECT * FROM compounding_regulations WHERE state_code = $1 ORDER BY title',
      [stateCode]
    );
  },

  findAll: async (): Promise<CompoundingRegulation[]> => {
    return query<CompoundingRegulation>(
      'SELECT * FROM compounding_regulations ORDER BY regulation_type, state_code NULLS FIRST, title'
    );
  },

  create: async (data: Omit<CompoundingRegulation, 'id' | 'created_at' | 'updated_at'>): Promise<CompoundingRegulation> => {
    const id = uuid();
    const result = await queryOne<CompoundingRegulation>(
      `INSERT INTO compounding_regulations (id, regulation_type, state_code, title, description, requirements, source_url, effective_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, data.regulation_type, data.state_code, data.title, data.description, JSON.stringify(data.requirements), data.source_url, data.effective_date, data.notes]
    );
    return result!;
  },

  update: async (id: string, updates: Partial<CompoundingRegulation>): Promise<CompoundingRegulation | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = ['regulation_type', 'state_code', 'title', 'description', 'requirements', 'source_url', 'effective_date', 'notes'];

    for (const field of allowedFields) {
      if (field in updates) {
        fields.push(`${field} = $${paramIndex}`);
        const value = updates[field as keyof CompoundingRegulation];
        values.push(field === 'requirements' && value ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (fields.length === 0) return CompoundingRegulationModel.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    return queryOne<CompoundingRegulation>(
      `UPDATE compounding_regulations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await queryOne<{ id: string }>('DELETE FROM compounding_regulations WHERE id = $1 RETURNING id', [id]);
    return result !== null;
  },
};
