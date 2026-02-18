import { Pool } from 'pg';
import { config } from './index.js';

export const pool = new Pool({
  connectionString: config.database.url,
});

export const query = async <T>(text: string, params?: unknown[]): Promise<T[]> => {
  const result = await pool.query(text, params);
  return result.rows as T[];
};

export const queryOne = async <T>(text: string, params?: unknown[]): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return rows[0] || null;
};

export const transaction = async <T>(callback: (client: ReturnType<typeof pool.connect> extends Promise<infer C> ? C : never) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
