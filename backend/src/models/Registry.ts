import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';
import { Drug } from './Drug.js';

export interface RegistryEntry {
  id: string;
  user_id: string;
  drug_id: string;
  notes: string | null;
  created_at: Date;
}

export interface RegistryEntryWithDrug extends RegistryEntry {
  drug: Drug;
}

export const RegistryModel = {
  findByUser: async (userId: string): Promise<RegistryEntryWithDrug[]> => {
    const rows = await query<RegistryEntry & Drug & { registry_id: string; registry_notes: string; registry_created_at: Date }>(
      `SELECT
        r.id as registry_id,
        r.notes as registry_notes,
        r.created_at as registry_created_at,
        r.user_id,
        r.drug_id,
        d.*
       FROM registry r
       JOIN drugs d ON r.drug_id = d.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    return rows.map(row => ({
      id: row.registry_id,
      user_id: row.user_id,
      drug_id: row.drug_id,
      notes: row.registry_notes,
      created_at: row.registry_created_at,
      drug: {
        id: row.id,
        ndc: row.ndc,
        name: row.name,
        generic_name: row.generic_name,
        dosage_form: row.dosage_form,
        strength: row.strength,
        route: row.route,
        manufacturer: row.manufacturer,
        rx_otc: row.rx_otc,
        dea_schedule: row.dea_schedule,
        species: row.species,
        active_ingredients: row.active_ingredients,
        fda_application_number: row.fda_application_number,
        marketing_status: row.marketing_status,
        source: row.source,
        raw_data: row.raw_data,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    }));
  },

  findByUserAndDrug: async (userId: string, drugId: string): Promise<RegistryEntry | null> => {
    return queryOne<RegistryEntry>(
      'SELECT * FROM registry WHERE user_id = $1 AND drug_id = $2',
      [userId, drugId]
    );
  },

  add: async (userId: string, drugId: string, notes?: string): Promise<RegistryEntry> => {
    const id = uuid();
    const result = await queryOne<RegistryEntry>(
      `INSERT INTO registry (id, user_id, drug_id, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, drug_id) DO UPDATE SET notes = EXCLUDED.notes
       RETURNING *`,
      [id, userId, drugId, notes || null]
    );
    return result!;
  },

  remove: async (userId: string, drugId: string): Promise<boolean> => {
    const result = await query<{ id: string }>(
      'DELETE FROM registry WHERE user_id = $1 AND drug_id = $2 RETURNING id',
      [userId, drugId]
    );
    return result.length > 0;
  },

  updateNotes: async (userId: string, drugId: string, notes: string): Promise<RegistryEntry | null> => {
    return queryOne<RegistryEntry>(
      'UPDATE registry SET notes = $3 WHERE user_id = $1 AND drug_id = $2 RETURNING *',
      [userId, drugId, notes]
    );
  },
};
