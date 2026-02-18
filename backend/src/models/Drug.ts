import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface Drug {
  id: string;
  ndc: string;
  name: string;
  generic_name: string | null;
  dosage_form: string | null;
  strength: string | null;
  route: string | null;
  manufacturer: string | null;
  rx_otc: 'RX' | 'OTC' | 'BOTH';
  dea_schedule: 'I' | 'II' | 'III' | 'IV' | 'V' | null;
  species: 'HUMAN' | 'ANIMAL' | 'BOTH';
  active_ingredients: object | null;
  fda_application_number: string | null;
  marketing_status: string | null;
  source: string;
  raw_data: object | null;
  created_at: Date;
  updated_at: Date;
}

export interface DrugSearchParams {
  search?: string;
  rx_otc?: string;
  dea_schedule?: string;
  species?: string;
  dosage_form?: string;
  manufacturer?: string;
  limit?: number;
  offset?: number;
}

export const DrugModel = {
  findById: async (id: string): Promise<Drug | null> => {
    return queryOne<Drug>('SELECT * FROM drugs WHERE id = $1', [id]);
  },

  findByNdc: async (ndc: string): Promise<Drug | null> => {
    return queryOne<Drug>('SELECT * FROM drugs WHERE ndc = $1', [ndc]);
  },

  search: async (params: DrugSearchParams): Promise<{ drugs: Drug[]; total: number }> => {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.search) {
      conditions.push(`(
        name ILIKE $${paramIndex} OR
        generic_name ILIKE $${paramIndex} OR
        ndc ILIKE $${paramIndex} OR
        manufacturer ILIKE $${paramIndex}
      )`);
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    if (params.rx_otc) {
      conditions.push(`rx_otc = $${paramIndex}`);
      values.push(params.rx_otc);
      paramIndex++;
    }

    if (params.dea_schedule) {
      if (params.dea_schedule === 'NONE') {
        conditions.push('dea_schedule IS NULL');
      } else {
        conditions.push(`dea_schedule = $${paramIndex}`);
        values.push(params.dea_schedule);
        paramIndex++;
      }
    }

    if (params.species) {
      conditions.push(`species = $${paramIndex}`);
      values.push(params.species);
      paramIndex++;
    }

    if (params.dosage_form) {
      conditions.push(`dosage_form ILIKE $${paramIndex}`);
      values.push(`%${params.dosage_form}%`);
      paramIndex++;
    }

    if (params.manufacturer) {
      conditions.push(`manufacturer ILIKE $${paramIndex}`);
      values.push(`%${params.manufacturer}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM drugs ${whereClause}`,
      values
    );
    const total = parseInt(countResult[0].count, 10);

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const drugs = await query<Drug>(
      `SELECT * FROM drugs ${whereClause} ORDER BY name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return { drugs, total };
  },

  create: async (drug: Omit<Drug, 'id' | 'created_at' | 'updated_at'>): Promise<Drug> => {
    const id = uuid();
    const result = await queryOne<Drug>(
      `INSERT INTO drugs (
        id, ndc, name, generic_name, dosage_form, strength, route,
        manufacturer, rx_otc, dea_schedule, species, active_ingredients,
        fda_application_number, marketing_status, source, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        id, drug.ndc, drug.name, drug.generic_name, drug.dosage_form,
        drug.strength, drug.route, drug.manufacturer, drug.rx_otc,
        drug.dea_schedule, drug.species, JSON.stringify(drug.active_ingredients),
        drug.fda_application_number, drug.marketing_status, drug.source,
        JSON.stringify(drug.raw_data),
      ]
    );
    return result!;
  },

  update: async (id: string, updates: Partial<Drug>): Promise<Drug | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'generic_name', 'dosage_form', 'strength', 'route',
      'manufacturer', 'rx_otc', 'dea_schedule', 'species', 'active_ingredients',
      'fda_application_number', 'marketing_status',
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        fields.push(`${field} = $${paramIndex}`);
        const value = updates[field as keyof Drug];
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (fields.length === 0) return DrugModel.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    return queryOne<Drug>(
      `UPDATE drugs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
  },

  getDistinctValues: async (field: string): Promise<string[]> => {
    const allowedFields = ['dosage_form', 'route', 'manufacturer', 'rx_otc', 'dea_schedule', 'species'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid field: ${field}`);
    }

    const result = await query<{ value: string }>(
      `SELECT DISTINCT ${field} as value FROM drugs WHERE ${field} IS NOT NULL ORDER BY ${field}`
    );
    return result.map(r => r.value);
  },
};
