import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface Discussion {
  id: string;
  drug_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DiscussionWithUser extends Discussion {
  user_name: string;
  user_email: string;
}

export const DiscussionModel = {
  findById: async (id: string): Promise<DiscussionWithUser | null> => {
    return queryOne<DiscussionWithUser>(
      `SELECT d.*, u.name as user_name, u.email as user_email
       FROM discussions d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );
  },

  findByDrug: async (drugId: string): Promise<DiscussionWithUser[]> => {
    return query<DiscussionWithUser>(
      `SELECT d.*, u.name as user_name, u.email as user_email
       FROM discussions d
       JOIN users u ON d.user_id = u.id
       WHERE d.drug_id = $1
       ORDER BY d.created_at ASC`,
      [drugId]
    );
  },

  create: async (data: { drug_id: string; user_id: string; content: string; parent_id?: string }): Promise<Discussion> => {
    const id = uuid();
    const result = await queryOne<Discussion>(
      `INSERT INTO discussions (id, drug_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, data.drug_id, data.user_id, data.content, data.parent_id || null]
    );
    return result!;
  },

  update: async (id: string, userId: string, content: string): Promise<Discussion | null> => {
    return queryOne<Discussion>(
      `UPDATE discussions SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, id, userId]
    );
  },

  delete: async (id: string, userId: string, isAdmin: boolean): Promise<boolean> => {
    const query_str = isAdmin
      ? 'DELETE FROM discussions WHERE id = $1 RETURNING id'
      : 'DELETE FROM discussions WHERE id = $1 AND user_id = $2 RETURNING id';
    const params = isAdmin ? [id] : [id, userId];

    const result = await queryOne<{ id: string }>(query_str, params);
    return result !== null;
  },
};
