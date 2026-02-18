import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface CompetitorDrug {
  id: string;
  competitor: string;
  drug_id: string | null;
  external_name: string;
  url: string | null;
  price: number | null;
  category: string | null;
  requires_prescription: boolean | null;
  requires_consultation: boolean | null;
  raw_data: object | null;
  scraped_at: Date;
  created_at: Date;
}

export interface CompetitorDrugWithMatch extends CompetitorDrug {
  drug_name?: string;
  drug_ndc?: string;
}

export const CompetitorDrugModel = {
  findById: async (id: string): Promise<CompetitorDrugWithMatch | null> => {
    return queryOne<CompetitorDrugWithMatch>(
      `SELECT cd.*, d.name as drug_name, d.ndc as drug_ndc
       FROM competitor_drugs cd
       LEFT JOIN drugs d ON cd.drug_id = d.id
       WHERE cd.id = $1`,
      [id]
    );
  },

  findByCompetitor: async (competitor: string, limit = 100, offset = 0, search?: string): Promise<{ items: CompetitorDrugWithMatch[]; total: number }> => {
    const searchPattern = search ? `%${search}%` : null;

    const countQuery = search
      ? `SELECT COUNT(*) as count FROM competitor_drugs
         WHERE competitor = $1 AND external_name IS NOT NULL AND TRIM(external_name) != ''
           AND (external_name ILIKE $2 OR category ILIKE $2)`
      : `SELECT COUNT(*) as count FROM competitor_drugs
         WHERE competitor = $1 AND external_name IS NOT NULL AND TRIM(external_name) != ''`;

    const countValues = search ? [competitor, searchPattern] : [competitor];
    const countResult = await query<{ count: string }>(countQuery, countValues);
    const total = parseInt(countResult[0].count, 10);

    const itemsQuery = search
      ? `SELECT cd.*, d.name as drug_name, d.ndc as drug_ndc
         FROM competitor_drugs cd
         LEFT JOIN drugs d ON cd.drug_id = d.id
         WHERE cd.competitor = $1 AND cd.external_name IS NOT NULL AND TRIM(cd.external_name) != ''
           AND (cd.external_name ILIKE $4 OR cd.category ILIKE $4)
         ORDER BY cd.external_name
         LIMIT $2 OFFSET $3`
      : `SELECT cd.*, d.name as drug_name, d.ndc as drug_ndc
         FROM competitor_drugs cd
         LEFT JOIN drugs d ON cd.drug_id = d.id
         WHERE cd.competitor = $1 AND cd.external_name IS NOT NULL AND TRIM(cd.external_name) != ''
         ORDER BY cd.external_name
         LIMIT $2 OFFSET $3`;

    const itemsValues = search ? [competitor, limit, offset, searchPattern] : [competitor, limit, offset];
    const items = await query<CompetitorDrugWithMatch>(itemsQuery, itemsValues);

    return { items, total };
  },

  findByDrug: async (drugId: string): Promise<CompetitorDrug[]> => {
    return query<CompetitorDrug>(
      'SELECT * FROM competitor_drugs WHERE drug_id = $1 ORDER BY competitor',
      [drugId]
    );
  },

  findUnmatched: async (competitor?: string): Promise<CompetitorDrug[]> => {
    if (competitor) {
      return query<CompetitorDrug>(
        'SELECT * FROM competitor_drugs WHERE drug_id IS NULL AND competitor = $1 ORDER BY external_name',
        [competitor]
      );
    }
    return query<CompetitorDrug>(
      'SELECT * FROM competitor_drugs WHERE drug_id IS NULL ORDER BY competitor, external_name'
    );
  },

  create: async (data: Omit<CompetitorDrug, 'id' | 'created_at'>): Promise<CompetitorDrug> => {
    const id = uuid();
    const result = await queryOne<CompetitorDrug>(
      `INSERT INTO competitor_drugs (
        id, competitor, drug_id, external_name, url, price, category,
        requires_prescription, requires_consultation, raw_data, scraped_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id, data.competitor, data.drug_id, data.external_name, data.url,
        data.price, data.category, data.requires_prescription,
        data.requires_consultation, JSON.stringify(data.raw_data), data.scraped_at,
      ]
    );
    return result!;
  },

  updateMatch: async (id: string, drugId: string | null): Promise<CompetitorDrug | null> => {
    return queryOne<CompetitorDrug>(
      'UPDATE competitor_drugs SET drug_id = $1 WHERE id = $2 RETURNING *',
      [drugId, id]
    );
  },

  deleteByCompetitor: async (competitor: string): Promise<number> => {
    const result = await query<{ id: string }>(
      'DELETE FROM competitor_drugs WHERE competitor = $1 RETURNING id',
      [competitor]
    );
    return result.length;
  },

  getCompetitors: async (): Promise<{ competitor: string; count: number }[]> => {
    return query<{ competitor: string; count: number }>(
      `SELECT competitor, COUNT(*) as count
       FROM competitor_drugs
       GROUP BY competitor
       ORDER BY competitor`
    );
  },
};
