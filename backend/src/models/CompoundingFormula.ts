import { query, queryOne, transaction } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface CompoundingFormula {
  id: string;
  name: string;
  drug_id: string | null;
  dosage_form: string | null;
  route: string | null;
  species: 'HUMAN' | 'ANIMAL' | 'BOTH';
  beyond_use_date: string | null;
  formula_type: '503A' | '503B';
  status: 'DRAFT' | 'APPROVED' | 'DISCONTINUED';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FormulaIngredient {
  id: string;
  formula_id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
  purpose: string | null;
  order_index: number;
}

export interface FormulaIngredientWithDetails extends FormulaIngredient {
  ingredient_name: string;
  cas_number: string | null;
}

export interface CompoundingFormulaWithIngredients extends CompoundingFormula {
  ingredients: FormulaIngredientWithDetails[];
  drug_name?: string;
}

export const CompoundingFormulaModel = {
  findById: async (id: string): Promise<CompoundingFormulaWithIngredients | null> => {
    const formula = await queryOne<CompoundingFormula & { drug_name?: string }>(
      `SELECT cf.*, d.name as drug_name
       FROM compounding_formulas cf
       LEFT JOIN drugs d ON cf.drug_id = d.id
       WHERE cf.id = $1`,
      [id]
    );

    if (!formula) return null;

    const ingredients = await query<FormulaIngredientWithDetails>(
      `SELECT fi.*, bi.name as ingredient_name, bi.cas_number
       FROM formula_ingredients fi
       JOIN bulk_ingredients bi ON fi.ingredient_id = bi.id
       WHERE fi.formula_id = $1
       ORDER BY fi.order_index`,
      [id]
    );

    return { ...formula, ingredients };
  },

  search: async (params: {
    search?: string;
    formula_type?: string;
    status?: string;
    species?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CompoundingFormula[]; total: number }> => {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.search) {
      conditions.push(`name ILIKE $${paramIndex}`);
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    if (params.formula_type) {
      conditions.push(`formula_type = $${paramIndex}`);
      values.push(params.formula_type);
      paramIndex++;
    }

    if (params.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    if (params.species) {
      conditions.push(`species = $${paramIndex}`);
      values.push(params.species);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM compounding_formulas ${whereClause}`,
      values
    );
    const total = parseInt(countResult[0].count, 10);

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const items = await query<CompoundingFormula>(
      `SELECT * FROM compounding_formulas ${whereClause} ORDER BY name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return { items, total };
  },

  create: async (
    data: Omit<CompoundingFormula, 'id' | 'created_at' | 'updated_at'>,
    ingredients?: Omit<FormulaIngredient, 'id' | 'formula_id'>[]
  ): Promise<CompoundingFormulaWithIngredients> => {
    return transaction(async (client) => {
      const formulaId = uuid();

      const formulaResult = await client.query(
        `INSERT INTO compounding_formulas (id, name, drug_id, dosage_form, route, species, beyond_use_date, formula_type, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [formulaId, data.name, data.drug_id, data.dosage_form, data.route, data.species, data.beyond_use_date, data.formula_type, data.status, data.notes]
      );

      const formula = formulaResult.rows[0] as CompoundingFormula;
      const formulaIngredients: FormulaIngredientWithDetails[] = [];

      if (ingredients && ingredients.length > 0) {
        for (const ing of ingredients) {
          const ingId = uuid();
          await client.query(
            `INSERT INTO formula_ingredients (id, formula_id, ingredient_id, quantity, unit, purpose, order_index)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [ingId, formulaId, ing.ingredient_id, ing.quantity, ing.unit, ing.purpose, ing.order_index]
          );
        }

        const ingredientsResult = await client.query(
          `SELECT fi.*, bi.name as ingredient_name, bi.cas_number
           FROM formula_ingredients fi
           JOIN bulk_ingredients bi ON fi.ingredient_id = bi.id
           WHERE fi.formula_id = $1
           ORDER BY fi.order_index`,
          [formulaId]
        );
        formulaIngredients.push(...ingredientsResult.rows);
      }

      return { ...formula, ingredients: formulaIngredients };
    });
  },

  update: async (id: string, updates: Partial<CompoundingFormula>): Promise<CompoundingFormula | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'drug_id', 'dosage_form', 'route', 'species', 'beyond_use_date', 'formula_type', 'status', 'notes'];

    for (const field of allowedFields) {
      if (field in updates) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field as keyof CompoundingFormula]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return queryOne<CompoundingFormula>('SELECT * FROM compounding_formulas WHERE id = $1', [id]);

    fields.push('updated_at = NOW()');
    values.push(id);

    return queryOne<CompoundingFormula>(
      `UPDATE compounding_formulas SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
  },

  updateIngredients: async (formulaId: string, ingredients: Omit<FormulaIngredient, 'id' | 'formula_id'>[]): Promise<FormulaIngredientWithDetails[]> => {
    return transaction(async (client) => {
      await client.query('DELETE FROM formula_ingredients WHERE formula_id = $1', [formulaId]);

      for (const ing of ingredients) {
        const ingId = uuid();
        await client.query(
          `INSERT INTO formula_ingredients (id, formula_id, ingredient_id, quantity, unit, purpose, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ingId, formulaId, ing.ingredient_id, ing.quantity, ing.unit, ing.purpose, ing.order_index]
        );
      }

      const result = await client.query(
        `SELECT fi.*, bi.name as ingredient_name, bi.cas_number
         FROM formula_ingredients fi
         JOIN bulk_ingredients bi ON fi.ingredient_id = bi.id
         WHERE fi.formula_id = $1
         ORDER BY fi.order_index`,
        [formulaId]
      );

      return result.rows;
    });
  },

  delete: async (id: string): Promise<boolean> => {
    return transaction(async (client) => {
      await client.query('DELETE FROM formula_ingredients WHERE formula_id = $1', [id]);
      const result = await client.query('DELETE FROM compounding_formulas WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    });
  },
};
