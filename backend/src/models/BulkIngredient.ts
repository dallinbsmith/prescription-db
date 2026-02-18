import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface BulkIngredient {
  id: string;
  name: string;
  cas_number: string | null;
  usp_nf_status: boolean;
  fda_bulk_list: '503A_POSITIVE' | '503B_POSITIVE' | 'NOT_LISTED' | 'WITHDRAWN';
  category: string | null;
  storage_requirements: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export const BulkIngredientModel = {
  findById: async (id: string): Promise<BulkIngredient | null> => {
    return queryOne<BulkIngredient>('SELECT * FROM bulk_ingredients WHERE id = $1', [id]);
  },

  findByCasNumber: async (casNumber: string): Promise<BulkIngredient | null> => {
    return queryOne<BulkIngredient>('SELECT * FROM bulk_ingredients WHERE cas_number = $1', [casNumber]);
  },

  search: async (params: { search?: string; fda_bulk_list?: string; category?: string; limit?: number; offset?: number }): Promise<{ items: BulkIngredient[]; total: number }> => {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR cas_number ILIKE $${paramIndex})`);
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    if (params.fda_bulk_list) {
      conditions.push(`fda_bulk_list = $${paramIndex}`);
      values.push(params.fda_bulk_list);
      paramIndex++;
    }

    if (params.category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(params.category);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM bulk_ingredients ${whereClause}`,
      values
    );
    const total = parseInt(countResult[0].count, 10);

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const items = await query<BulkIngredient>(
      `SELECT * FROM bulk_ingredients ${whereClause} ORDER BY name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return { items, total };
  },

  create: async (data: Omit<BulkIngredient, 'id' | 'created_at' | 'updated_at'>): Promise<BulkIngredient> => {
    const id = uuid();
    const result = await queryOne<BulkIngredient>(
      `INSERT INTO bulk_ingredients (id, name, cas_number, usp_nf_status, fda_bulk_list, category, storage_requirements, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, data.name, data.cas_number, data.usp_nf_status, data.fda_bulk_list, data.category, data.storage_requirements, data.notes]
    );
    return result!;
  },

  update: async (id: string, updates: Partial<BulkIngredient>): Promise<BulkIngredient | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'cas_number', 'usp_nf_status', 'fda_bulk_list', 'category', 'storage_requirements', 'notes'];

    for (const field of allowedFields) {
      if (field in updates) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field as keyof BulkIngredient]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return BulkIngredientModel.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    return queryOne<BulkIngredient>(
      `UPDATE bulk_ingredients SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await queryOne<{ id: string }>('DELETE FROM bulk_ingredients WHERE id = $1 RETURNING id', [id]);
    return result !== null;
  },

  getCategories: async (): Promise<string[]> => {
    const result = await query<{ category: string }>(
      'SELECT DISTINCT category FROM bulk_ingredients WHERE category IS NOT NULL ORDER BY category'
    );
    return result.map(r => r.category);
  },
};
