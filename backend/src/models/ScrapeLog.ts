import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export interface ScrapeLog {
  id: string;
  competitor: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  drugs_found: number;
  error_message: string | null;
  duration_ms: number;
  created_at: Date;
}

export const ScrapeLogModel = {
  findById: async (id: string): Promise<ScrapeLog | null> => {
    return queryOne<ScrapeLog>('SELECT * FROM scrape_logs WHERE id = $1', [id]);
  },

  findByCompetitor: async (competitor: string, limit = 20): Promise<ScrapeLog[]> => {
    return query<ScrapeLog>(
      'SELECT * FROM scrape_logs WHERE competitor = $1 ORDER BY created_at DESC LIMIT $2',
      [competitor, limit]
    );
  },

  findRecent: async (limit = 50): Promise<ScrapeLog[]> => {
    return query<ScrapeLog>(
      'SELECT * FROM scrape_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
  },

  create: async (data: Omit<ScrapeLog, 'id' | 'created_at'>): Promise<ScrapeLog> => {
    const id = uuid();
    const result = await queryOne<ScrapeLog>(
      `INSERT INTO scrape_logs (id, competitor, status, drugs_found, error_message, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.competitor, data.status, data.drugs_found, data.error_message, data.duration_ms]
    );
    return result!;
  },

  getLatestByCompetitor: async (): Promise<Map<string, ScrapeLog>> => {
    const logs = await query<ScrapeLog>(
      `SELECT DISTINCT ON (competitor) *
       FROM scrape_logs
       ORDER BY competitor, created_at DESC`
    );

    const map = new Map<string, ScrapeLog>();
    for (const log of logs) {
      map.set(log.competitor, log);
    }
    return map;
  },
};
